export interface FileMapping {
    filepath: string;
    content: string;
}

export class Prompt {
    public static firstStagePrompt(userPrompt: string, fileNames: string[]): string {
        return (
            `
        You are DuckDuckCode, a highly skilled coding assistant. Your task is to analyze the user's prompt and the list of files to determine which files need to be reviewed or modified to implement the requested changes.

        ---

        ### User's Prompt:
        ${userPrompt}

        ---

        ### List of Files:
        Here are the files available in the repository:
        \`\`\`json
        ${JSON.stringify(fileNames, null, 2)}
        \`\`\`

        ---

        ### Steps to Follow:
        1. Carefully read the user's prompt to understand the changes or features they want to implement.
        2. Review the list of files provided.
        3. Identify which files are relevant to the user's request and need to be reviewed or modified.
        4. Consider file types, file paths, and the context of the user's prompt to make your decision.
        5. Do not request or assume the contents of the files at this stage. Only use the file names and paths to determine relevance.

        ---

        ### Response Format:
        Once you have identified the relevant files, respond with a JSON array in the following format:
        \`\`\`json
        [
            "path/to/file1",
            "path/to/file2",
            "path/to/file3"
        ]
        \`\`\`

        ---

        ### Instructions:
        1. Only include files that are directly relevant to the user's prompt.
        2. Ensure the file paths match exactly with the ones provided in the list.
        3. Do not include any additional explanations or notes in your response.

        ---

        ### Example Response:
        If the relevant files are \`cmd/main.go\`, \`cmd/api.go\`, and\`internal/models/customer.go\`, your response should look like this:
        \`\`\`json
        [
            "cmd/main.go",
            "cmd/api.go",
            "internal/models/customer.go"
        ]
        \`\`\`

        ---

        Your response should only contain the JSON array with the relevant file paths. Do not include any additional text.
        `
        );
    }
    public static secondStagePrompt(fileContents: FileMapping[]): string {
        const jsonFiles = JSON.stringify(fileContents);

        return (
            `
        You are a highly skilled coding assistant. Your task is to modify the provided files to satisfy the user's original prompt. Follow these steps carefully:

        ---

        ### Step 1: Review the File Contents
        Here are the contents of the relevant files that you identified earlier:
        \`\`\`json
        ${jsonFiles}
        \`\`\`

        ---

        ### Step 2: Understand the User's Prompt
        Carefully read the user's original prompt again to ensure you understand the changes or features they want to implement.

        ---

        ### Step 3: Modify the Files
        Update the contents of the files as needed to satisfy the user's prompt. Ensure that your changes are accurate, efficient, and follow best practices for the given programming language.

        ---

        ### Step 4: Respond with the Updated Files
        Once you have made the changes, respond with a JSON array in the following format:
        \`\`\`json
        [
            { "filepath": "path/to/file1", "content": "updated content of file1" },
            { "filepath": "path/to/file2", "content": "updated content of file2" },
            { "filepath": "path/to/file3", "content": "updated content of file3" }
        ]
        \`\`\`

        ---

        ### Instructions:
        1. Replace the "content" field for each file with the updated content.
        2. Only include files that have been modified. If a file does not require changes, exclude it from the response.
        3. Ensure the file paths ("filePath") match exactly with the ones provided.

        ---

        ### Example Response:
        \`\`\`json
        [
            { "filePath": "cmd/main.go", "content": "package main\n\nfunc main() {\n    // Updated logic\n}" },
            { "filePath": "internal/models/customers.go", "content": "package models\n\ntype Customer struct {\n    ID   int\n    Name string\n}" }
        ]
        \`\`\`

        ---

        Your response should only contain the JSON array with the updated file contents. Do not include any additional explanations or notes.
        `
        );
    }

}
