export type MetaBaseQueryFormat = 'csv' | 'json';

export type Data = {
  lhs: string[];
  rhs: string[];
  support: number[];
  confidence: number[];
  lift: number[];
  count: number[];
};
type Rule = {
  number: number;
  lhs: string;
  rhs: string;
  lift: number;
  confidence: number;
  support: number;
  count: number;
};
