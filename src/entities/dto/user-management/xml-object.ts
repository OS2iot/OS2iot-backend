export type XMLValue = string | number | boolean | null | XMLObject | XMLValue[];

export type XMLObject = {
  [key: string]: XMLValue;
};

export type XMLOutput = Record<string, any>;
