import * as NGL from 'ngl';
import { fetchNGLDataFromFile } from '../helper/DataHelper';
import {
  CONTACT_DISTANCE_PROXIMITY,
  ICouplingScore,
  ISecondaryStructureData,
  SECONDARY_STRUCTURE_KEYS,
  SECONDARY_STRUCTURE_SECTION,
} from './chell-data';
import Chell1DSection from './Chell1DSection';
import { CouplingContainer } from './CouplingContainer';

/**
 * A ChellPDB instance provides an API to interact with a loaded PDB file while hiding the implementation details of how it is loaded.
 *
 * @export
 */
export class ChellPDB {
  [key: string]: any;

  public get secondaryStructureSections(): SECONDARY_STRUCTURE_SECTION[][] {
    const result = new Array<SECONDARY_STRUCTURE_SECTION[]>();
    this.nglData.eachResidue(residue => {
      if (residue.isProtein()) {
        const { chainIndex } = residue;
        while (!result[chainIndex]) {
          result.push(new Array<SECONDARY_STRUCTURE_SECTION>());
        }
        let structId = 'C' as SECONDARY_STRUCTURE_KEYS;
        if (residue.isSheet()) {
          structId = 'E';
        } else if (residue.isHelix()) {
          structId = 'H';
        } else if (residue.isTurn()) {
          return;
        }
        if (result[chainIndex].length >= 1 && result[chainIndex][result[chainIndex].length - 1].label === structId) {
          result[chainIndex][result[chainIndex].length - 1].updateEnd(residue.resno);
        } else {
          result[chainIndex].push(new Chell1DSection(structId, residue.resno));
        }
      }
    });
    return result;
  }

  public get secondaryStructure(): ISecondaryStructureData[] {
    const result = new Array<ISecondaryStructureData>();
    this.nglData.eachResidue(residue => {
      if (residue.isProtein()) {
        let structId = 'C' as SECONDARY_STRUCTURE_KEYS;
        if (residue.isSheet()) {
          structId = 'E';
        } else if (residue.isHelix()) {
          structId = 'H';
        } else if (residue.isTurn()) {
          return;
        }
        result.push({ resno: residue.resno, structId });
      }
    });
    return result;
  }
  public get nglStructure() {
    return this.nglData;
  }

  public static readonly NGL_C_ALPHA_INDEX = 'CA|C';
  /**
   * Creates an instance of ChellPDB with PDB data.
   *
   * !IMPORTANT! Since fetching the data is an asynchronous action, this must be used to create a new instance!
   */
  public static async createPDB(filename: string = '') {
    const result = new ChellPDB();
    result.nglData = await fetchNGLDataFromFile(filename);
    return result;
  }

  public static async createPDBFromFile(file: File) {
    const result = new ChellPDB();
    result.nglData = await NGL.autoLoad(file);
    return result;
  }

  protected nglData: NGL.Structure = new NGL.Structure();

  private constructor() {}

  public eachResidue(callback: (residue: NGL.ResidueProxy) => void) {
    this.nglData.eachResidue(callback);
  }
  /**
   * Given some existing coupling scores, a new CouplingContainer will be created with data augmented with info derived from this PDB.
   *
   * @param couplingScores A collection of coupling scores to be augmented.
   * @param measuredProximity How to calculate the distance between two residues.
   * @returns A CouplingContainer with contact information from both the original array and this PDB file.
   */
  public generateCouplingsAmendedWithPDB(
    couplingScores: ICouplingScore[],
    measuredProximity: CONTACT_DISTANCE_PROXIMITY,
  ) {
    const result = new CouplingContainer(couplingScores);
    const alphaId = this.nglData.atomMap.dict[this.NGL_C_ALPHA_INDEX];

    const minDist: {
      [key: string]: number;
    } = {};

    this.nglData.eachResidue(outerResidue => {
      this.nglData.eachResidue(innerResidue => {
        if (outerResidue.isProtein() && innerResidue.isProtein()) {
          if (measuredProximity === CONTACT_DISTANCE_PROXIMITY.C_ALPHA) {
            const firstResidueCAlphaIndex = this.getCAlphaAtomIndexFromResidue(outerResidue.index, alphaId);
            const secondResidueCAlphaIndex = this.getCAlphaAtomIndexFromResidue(innerResidue.index, alphaId);
            result.addCouplingScore({
              dist: this.nglData
                .getAtomProxy(firstResidueCAlphaIndex)
                .distanceTo(this.nglData.getAtomProxy(secondResidueCAlphaIndex)),
              i: outerResidue.resno,
              j: innerResidue.resno,
            });
          } else {
            const key = `${Math.min(outerResidue.resno, innerResidue.resno)},${Math.max(
              outerResidue.resno,
              innerResidue.resno,
            )}`;
            if (!minDist[key]) {
              minDist[key] = this.getMinDistBetweenResidues(outerResidue.index, innerResidue.index);
            }
            result.addCouplingScore({
              dist: minDist[key],
              i: outerResidue.resno,
              j: innerResidue.resno,
            });
          }
        }
      });
    });

    return result;
  }

  /**
   * Find the index of the c-alpha atom for a given residue.
   *
   * @param residueIndex Index of the residue to find the c-alpha atom for.
   * @param alphaId Index that determines if an atom is a c-alpha.
   * @returns Index of the c-alpha atom with respect to the array of all of the atoms.
   */
  public getCAlphaAtomIndexFromResidue(residueIndex: number, alphaId: number): number {
    const { residueStore } = this.nglData;
    const atomOffset = residueStore.atomOffset[residueIndex];
    const atomCount = residueStore.atomCount[residueIndex];

    let result = atomOffset;
    while (residueStore.residueTypeId[result] !== alphaId && result < atomOffset + atomCount) {
      result++;
    }

    return result;
  }

  /**
   * Helper function to find the smallest possible distance between two residues via their atoms.
   *
   * @param firstResidueIndex Index of the first residue with respect to the array of all residues.
   * @param secondResidueIndex Index of the second residue with respect to the array of all residues.
   * @returns Shortest distance between the two residues in ångströms.
   */
  protected getMinDistBetweenResidues(firstResidueIndex: number, secondResidueIndex: number) {
    const { residueStore } = this.nglData;
    const firstResCount = residueStore.atomCount[firstResidueIndex];
    const secondResCount = residueStore.atomCount[secondResidueIndex];
    const firstAtomIndex = residueStore.atomOffset[firstResidueIndex];
    const secondAtomIndex = residueStore.atomOffset[secondResidueIndex];

    let minDist = Number.MAX_SAFE_INTEGER;
    for (let firstCounter = 0; firstCounter < firstResCount; ++firstCounter) {
      for (let secondCounter = 0; secondCounter < secondResCount; ++secondCounter) {
        minDist = Math.min(
          minDist,
          this.nglData
            .getAtomProxy(firstAtomIndex + firstCounter)
            .distanceTo(this.nglData.getAtomProxy(secondAtomIndex + secondCounter)),
        );
      }
    }
    return minDist;
  }
}