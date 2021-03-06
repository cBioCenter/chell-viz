// ~bb-viz~
// Bioblocks Data
// Enums, Interfaces and Types to make reading/writing biology data easier.
// ~bb-viz~

import { Structure } from 'ngl';

import {
  AMINO_ACID_1LETTER_CODE,
  Bioblocks1DSection,
  BioblocksPDB,
  CouplingContainer,
  ISpringGraphData,
} from '~bioblocks-viz~/data';

export type CONTACT_MAP_DATA_TYPE = IContactMapData;
export type NGL_DATA_TYPE = Structure;
export type SPRING_DATA_TYPE = ISpringGraphData;
export type T_SNE_DATA_TYPE = number[][];

export type BIOBLOCKS_DATA_TYPE = CONTACT_MAP_DATA_TYPE | NGL_DATA_TYPE | SPRING_DATA_TYPE | T_SNE_DATA_TYPE;

// TODO Better define Cell type to not be indices.
/** Shared data between Spring/T-SNE. Refers to index in points collection. */
export type CELL_TYPE = number;
export type RESIDUE_TYPE = number;

export enum VIZ_TYPE {
  ANATOMOGRAM = 'Anatomogram',
  CONTACT_MAP = 'Contact Map',
  INFO_PANEL = 'Info Panel',
  NGL = 'NGL',
  SPRING = 'Spring',
  'T_SNE' = 'T-SNE',
  'UMAP_SEQUENCE' = 'UMAP Sequence',
  'UMAP_TRANSCRIPTION' = 'UMAP Transcription',
}

export interface IContactMapData {
  couplingScores: CouplingContainer;
  pdbData?: {
    experimental?: BioblocksPDB;
    predicted?: BioblocksPDB;
  };
  secondaryStructures: SECONDARY_STRUCTURE[];
}

export interface IMonomerContact {
  dist?: number;
  i: number;
  j: number;
}

export enum COUPLING_SCORE_SOURCE {
  'cn' = 'cn',
  'dist' = 'dist',
  'dist_intra' = 'dist_intra',
  'dist_multimer' = 'dist_multimer',
  'fn' = 'fn',
  'probability' = 'probability',
  'precision' = 'precision',
  'score' = 'score',
}

export interface ICouplingScoreFilter<T = number | number[]> {
  // currentValue: T;
  // defaultValue: T;
  // name: string;
  filterFn(couplingScore: ICouplingScore): boolean;
  // onChange(newValue: T): void;
}

export interface ICouplingScore {
  A_i?: AMINO_ACID_1LETTER_CODE; // AMINO_ACID_SINGLE_LETTER_CODE;
  A_j?: AMINO_ACID_1LETTER_CODE; // AMINO_ACID_SINGLE_LETTER_CODE;
  cn?: number;
  dist?: number;
  dist_intra?: number;
  dist_multimer?: number;
  fn?: number;
  i: number;
  j: number;
  precision?: number;
  probability?: number;
  score?: number;
  segment_i?: string;
  segment_j?: string;
}

export enum CONTACT_DISTANCE_PROXIMITY {
  CLOSEST = 'CLOSEST ATOM',
  C_ALPHA = 'C-α',
}

export interface ISecondaryStructureData {
  resno: number;
  structId: SECONDARY_STRUCTURE_KEYS;
}

export type SECONDARY_STRUCTURE_SECTION = Bioblocks1DSection<SECONDARY_STRUCTURE_KEYS>;
export type SECONDARY_STRUCTURE = Array<Bioblocks1DSection<SECONDARY_STRUCTURE_KEYS>>;

export interface IResiduePair {
  i: number;
  j: number;
}

export enum SECONDARY_STRUCTURE_CODES {
  'G' = '310_HELIX',
  'H' = 'ALPHA_HELIX',
  'I' = 'PI_HELIX',
  'T' = 'HYDROGEN_BONDED_TURN',
  'E' = 'BETA_SHEET',
  'B' = 'BETA_BRIDGE',
  'S' = 'BEND',
  'C' = 'COIL',
}

export type SECONDARY_STRUCTURE_KEYS = keyof typeof SECONDARY_STRUCTURE_CODES;

export enum BIOBLOCKS_CHART_EVENT_TYPE {
  AFTER_PLOT,
  CLICK,
  DOUBLE_CLICK,
  HOVER,
  LEGEND_CLICK,
  RELAYOUT,
  SELECTION,
  UNHOVER,
}

export enum BIOBLOCKS_CHART_PIECE {
  AXIS,
  LEGEND,
  POINT,
}

export type SPECIES_TYPE =
  | 'anolis_carolinensis'
  | 'arabidopsis_thaliana'
  | 'bos_taurus'
  | 'brachypodium_distachyon'
  | 'gallus_gallus'
  | 'homo_sapiens'
  | 'hordeum_vulgare'
  | 'macaca_mulatta'
  | 'monodelphis_domestica'
  | 'mus_musculus'
  | 'oryza_sativa'
  | 'papio_anubis'
  | 'rattus_norvegicus'
  | 'solanum_lycopersicum'
  | 'solanum_tuberosum'
  | 'sorghum_bicolor'
  | 'tetraodon_nigroviridis'
  | 'triticum_aestivum'
  | 'xenopus_tropicalis'
  | 'zea_mays';
