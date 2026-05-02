export interface TitleBlockField {
  name: string;
  label: string;
  defaultValue: string;
}

export interface TitleBlockTemplate {
  id: string;
  name: string;
  svgContent: string;
  fields: TitleBlockField[];
}

export interface TitleBlockData {
  templateId: string;
  values: Record<string, string>;
}
