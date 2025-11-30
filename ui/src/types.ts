import { Move } from 'citadels-common';

export interface Action {
  title: string;
  args?: string[];
  move: Move;
}

export type StatusBarMessageType = 'NORMAL' | 'HIGHLIGHTED' | 'ERROR';

export interface StatusBarData {
  type: StatusBarMessageType;
  message: string;
  args?: string[];
  actions?: Action[];
}

export interface CharacterMeta {
  id: number;
  name: string;
  rank: number;
  color: string;
  description: string;
}

export interface DistrictMeta {
  id: string;
  name: string;
  color: 'yellow' | 'green' | 'blue' | 'red' | 'purple' | string;
  cost: number;
  description?: string;
  image?: string;
}
