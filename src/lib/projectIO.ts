import type { Project } from "../models/project";

export function saveProjectToFile(project: Project): void {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.name.replace(/\s+/g, "_")}.schproj`;
  a.click();
  URL.revokeObjectURL(url);
}

export function loadProjectFromFile(): Promise<Project> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".schproj,application/json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error("No file selected"));
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const project = JSON.parse(e.target?.result as string) as Project;
          resolve(project);
        } catch {
          reject(new Error("Invalid project file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    };
    input.click();
  });
}
