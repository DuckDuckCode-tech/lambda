import * as fs from "fs";
import * as path from "path";
import * as util from "util";
import { pipeline } from "stream/promises";

export interface FileMapping {
    filePath: string;
    content: string;
}

export interface FileChanges {
    filePath: string;
    content: string;
    isNew: boolean;
}

const mkdir = util.promisify(fs.mkdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const rename = util.promisify(fs.rename);

export class FileSystemService {
    async getAllFilepathsInDirectory(directory: string): Promise<string[]> {
        const entries = await fs.promises.readdir(directory, { withFileTypes: true });
        const files: string[] = [];

        for (const entry of entries) {
            const fullPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                if (["node_modules", ".git", "dist", "_next"].includes(entry.name)) continue;
                files.push(...(await this.getAllFilepathsInDirectory(fullPath)));
            } else {
                files.push(fullPath);
            }
        }
        return files;
    }

    async createDirectory(directory: string) {
        await mkdir(directory, { recursive: true });
    }

    async readFile(filePath: string): Promise<string> {
        return await readFile(filePath, "utf8");
    }

    async readFiles(filePaths: string[]): Promise<FileMapping[]> {
        return Promise.all(
            filePaths.map(async (filePath) => {
                const content = await this.readFile(filePath);
                return {
                    filePath: filePath,
                    content: content,
                };
            })
        )
    }

    async writeFile(filePath: string, content: string) {
        await writeFile(filePath, content, "utf8");
    }

    async writeFiles(fileChanges: FileChanges[]) {
        await Promise.all(
            fileChanges.map(async (fileChange) => {
                await this.writeFile(fileChange.filePath, fileChange.content)
            })
        )
    }

    async rename(oldPath: string, newPath: string) {
        await rename(oldPath, newPath);
    }

    async pipeline(readableStream: any, writableStream: any) {
        await pipeline(readableStream, writableStream);
    }

    existsSync(path: string): boolean {
        return fs.existsSync(path);
    }

    rmSync(path: string, options: fs.RmOptions) {
        fs.rmSync(path, options);
    }

    unlinkSync(path: string) {
        fs.unlinkSync(path);
    }

    createWriteStream(path: string): fs.WriteStream {
        return fs.createWriteStream(path);
    }

    readdir(path: string): Promise<string[]> {
        return fs.promises.readdir(path);
    }
}
