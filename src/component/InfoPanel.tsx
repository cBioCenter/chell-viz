import * as React from 'react';
import { Accordion, Label } from 'semantic-ui-react';

import ResidueContext, { initialResidueContext, ResidueSelection } from '../context/ResidueContext';
import SecondaryStructureContext, { initialSecondaryStructureContext } from '../context/SecondaryStructureContext';
import { IContactMapData, SECONDARY_STRUCTURE, SECONDARY_STRUCTURE_CODES } from '../data/chell-data';
import { ChellPDB } from '../data/ChellPDB';
import { CouplingContainer } from '../data/CouplingContainer';
import { withDefaultProps } from '../helper/ReactHelper';

export const defaultInfoPanelProps = {
  data: {
    couplingScores: new CouplingContainer(),
  } as IContactMapData,
  height: 400,
  ...initialResidueContext,
  ...initialSecondaryStructureContext,
  width: 400,
};

export type InfoPanelProps = {} & typeof defaultInfoPanelProps;

export class InfoPanelClass extends React.Component<InfoPanelProps, any> {
  constructor(props: InfoPanelProps) {
    super(props);
  }

  public render() {
    const { data, height, lockedResiduePairs, width, selectedSecondaryStructures } = this.props;
    const unassignedResidues = data.pdbData
      ? this.renderUnassignedResidues(data.pdbData)
      : [<Label key={'unassigned-residues-none'} />];
    return (
      <div className="InfoPanel" style={{ height, width }}>
        <Accordion
          exclusive={false}
          panels={[
            {
              content: this.renderSecondaryStructures(data.pdbData ? data.pdbData.secondaryStructureSections : []),
              key: 'all-secondary-structures',
              title: `All Secondary Structures (${data.pdbData ? data.pdbData.secondaryStructureSections.length : 0}):`,
            },
            {
              content: unassignedResidues,
              key: 'unassigned-residues',
              title: `Unassigned Residues (${unassignedResidues.length}):`,
            },
            {
              content: this.renderSecondaryStructures(selectedSecondaryStructures),
              key: 'selected-secondary-structures',
              title: `Selected Secondary Structures (${selectedSecondaryStructures.length}):`,
            },
            {
              content: this.renderLockedResiduePairs(lockedResiduePairs),
              key: 'selected-residue-pairs',
              title: `Selected Residue Pairs (${lockedResiduePairs.size}):`,
            },
          ]}
        />
      </div>
    );
  }

  protected renderLockedResiduePairs(lockedResiduePairs: ResidueSelection) {
    return lockedResiduePairs.size === 0
      ? [<Label key={'locked-residue-pair-none'}>None</Label>]
      : Array.from(lockedResiduePairs.values()).map((pair, index) => (
          <Label key={`locked-residue-pair-${index}`}>{pair.join(', ')}</Label>
        ));
  }

  protected renderSecondaryStructures(selectedSecondaryStructures: SECONDARY_STRUCTURE) {
    return selectedSecondaryStructures.length === 0
      ? [<Label key={'sec-struct-none'}>None</Label>]
      : selectedSecondaryStructures.map((section, index) => (
          <Label key={`sec-struct-${index}`}>{`[${section.start}-${section.end}]: ${section.label} - ${
            SECONDARY_STRUCTURE_CODES[section.label]
          }`}</Label>
        ));
  }

  protected renderUnassignedResidues(pdbData: ChellPDB) {
    const result = new Array<JSX.Element>();
    pdbData.eachResidue(residue => {
      if (residue.isProtein()) {
        let isUnassigned = true;
        for (const section of pdbData.secondaryStructureSections) {
          if (section.contains(residue.resno)) {
            isUnassigned = false;
            break;
          }
        }
        if (isUnassigned) {
          result.push(
            <Label key={`unassigned-residue-${residue.resno}`}>
              {`[${
                residue.resno
              }: isCg? ${residue.isCg()}, isDna? ${residue.isDna()}, isHelix? ${residue.isHelix()}, isNucleic? ${residue.isNucleic()}, isProtein? ${residue.isProtein()}, isPolymer? ${residue.isPolymer()}, isSaccharide? ${residue.isSaccharide()}, isSheet? ${residue.isSheet()}, isTurn? ${residue.isTurn()}`}}
            </Label>,
          );
        }
      }
    });
    return result;
  }
}

export const InfoPanelWithDefaultProps = withDefaultProps(defaultInfoPanelProps, InfoPanelClass);

const InfoPanel = (props: any) => (
  <SecondaryStructureContext.Consumer>
    {secStructContext => (
      <ResidueContext.Consumer>
        {residueContext => <InfoPanelWithDefaultProps {...props} {...residueContext} {...secStructContext} />}
      </ResidueContext.Consumer>
    )}
  </SecondaryStructureContext.Consumer>
);

export default InfoPanel;
export { InfoPanel };