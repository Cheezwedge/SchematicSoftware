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
  visible: boolean;
}

export const BUILTIN_TEMPLATE_ID = "builtin-default";

export const DEFAULT_TITLE_BLOCK_FIELDS: TitleBlockField[] = [
  { name: "company",     label: "Company",      defaultValue: "" },
  { name: "projectName", label: "Project Name", defaultValue: "" },
  { name: "title",       label: "Sheet Title",  defaultValue: "" },
  { name: "drawnBy",     label: "Drawn By",     defaultValue: "" },
  { name: "checkedBy",   label: "Checked By",   defaultValue: "" },
  { name: "date",        label: "Date",         defaultValue: "" },
  { name: "revision",    label: "Rev",          defaultValue: "A" },
  { name: "sheetNumber", label: "Sheet No.",    defaultValue: "" },
];

export const DEFAULT_TITLE_BLOCK_TEMPLATE: TitleBlockTemplate = {
  id: BUILTIN_TEMPLATE_ID,
  name: "Default",
  svgContent: "",
  fields: DEFAULT_TITLE_BLOCK_FIELDS,
};

export function makeDefaultTitleBlockData(): TitleBlockData {
  return {
    templateId: BUILTIN_TEMPLATE_ID,
    values: Object.fromEntries(DEFAULT_TITLE_BLOCK_FIELDS.map((f) => [f.name, f.defaultValue])),
    visible: true,
  };
}
