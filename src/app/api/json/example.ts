export const CONTENT = (data: string, format: unknown): string => `DATA: \n"${data}"\n\n-----------\nExpected JSON format: 
${JSON.stringify(format, null, 2)}
\n\n-----------\nValid JSON output in expected format:`

export const EXAMPLE_PROMPT = `DATA: \n"Reika is 30 years old and graduated with a course of Information Technology at FEU - Institute of Technology"\n\n-----------\nExpected JSON format: 
{
  name: { type: "string" },
  age: { type: "number" },
  isProfessional: { type: "boolean" },
  courses: {
    type: "array",
    items: { type: "string" },
  },
}
\n\n-----------\nValid JSON output in expected format:`

export const EXAMPLE_ANSWER = `{
    name: "Reika",
    age: 30,
    isProfessional: true,
    courses: ["information technology"],
}`