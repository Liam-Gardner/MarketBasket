export type MetaBaseQueryFormat = 'csv' | 'json';

export type Data = {
  lhs: string[];
  rhs: string[];
  support: number[];
  confidence: number[];
  lift: number[];
  count: number[];
};
export type Rule = {
  lhs: string;
  rhs: string;
  support: number;
  confidence: number;
  lift: number;
  count: number;
  ruleNumber: number;
};
