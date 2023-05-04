import { APIOptions } from "assemblyscript/asc";
import { SourceModifier, ModifyPoint, ModifyType } from "proton-asc/src/preprocess";
import { EosioUtils } from "proton-asc/src/utils/utils";
import * as path from "path";
import * as fs from "fs";
import process from "process";

function optimizeCode(code) {
    var codeSegments = [];
    var index = 0;
    var segmentStart = 0;
    var segmentEnd = 0;
    var keyWord = "Name.fromString";
    do {
        index = code.indexOf(keyWord, index);
        if (index < 0) {
            break;
        }

        var start = code.indexOf('(', index);
        start += 1;
        var end = code.indexOf(')', start + 1);
        segmentEnd = end;

        var name = code.substring(start, end);
        start = name.indexOf('"');
        if (start >= 0) {
            end = name.indexOf('"', start+1);
        } else {
            start = name.indexOf("'", start);
            end = name.indexOf("'", start+1);
        }

        if (start < 0) {
            index += 1;
            continue;
        }

        name = name.substring(start + 1, end);
        name = EosioUtils.nameToHexString(name);
        codeSegments.push(code.substring(segmentStart, index));
        codeSegments.push(`Name.fromU64(${name})`);
        index = index + 1;
        segmentStart = segmentEnd + 1;
    } while (true);

    codeSegments.push(code.substring(segmentStart));
    code = codeSegments.join('');
    return code;
}

function modifySourceText(sourceText, point) {
    if (point.mode == ModifyType.REPLACE) {
        var prefix = sourceText.substring(0, point.range.start);
        var suffix = sourceText.substring(point.range.end, sourceText.length);
        return prefix + point.code + suffix;
    } else if (point.mode == ModifyType.APPEND) {
        return sourceText + point.code;
    } else if (point.mode == ModifyType.TOP) {
        return point.code + sourceText;
    } else if (point.mode == ModifyType.DELETE) {
        sourceText = sourceText.replaceAll(/export\s/g, " ");
        return sourceText;
    }
    return sourceText;
};

let sources = {}
export class APIOptionImpl implements APIOptions {
    transforms = []

    constructor (_sources: any, options: APIOptions) {
        Object.assign(this, options);
        sources = _sources;
    }

    readFile(filename: string, baseDir: string) : string | null {
        var name = path.resolve(baseDir, filename);
        var text_1;
        if (fs.readFileSync) {
            text_1 = fs.readFileSync(name, "utf8")
        } else {
            if (Object.prototype.hasOwnProperty.call(sources, name)) {
                text_1 = sources[name]
            } else {
                console.error(`File ${name} not found`)
                return null
            }
        }


        var sourceModifier = process.sourceModifier ? process.sourceModifier : new SourceModifier();
        let relativePath = path.relative(baseDir, name).split("\\").join("/");

        // Transform library imports
        if (relativePath.indexOf('/proton-tsc/') === -1 && !sourceModifier.fileExtMap.has(relativePath)) {
            const alternativePath = relativePath.replace(/.*node_modules/, '~lib').replace('/assembly', '')
            if (sourceModifier.fileExtMap.has(alternativePath)) {
                relativePath = alternativePath
            }
        }
        
        // Look for path in source modifier
        if (sourceModifier.fileExtMap.has(relativePath)) {
            var extCodes = sourceModifier.fileExtMap.get(relativePath);
            extCodes.sort((a, b) => {
                if (a.mode != b.mode) return a.mode - b.mode;
                return (b.range.end - a.range.end); 
            }).forEach(function (item) {
                text_1 = modifySourceText(text_1, item);
            });
            let importLang = `import * as _chain from "proton-tsc";\n`;

            // console.log("+++++++process.libPaths:", process.libPaths);
            if (process.libPaths && text_1.indexOf("apply(") >= 0) {
                process.libPaths.forEach((value, key) => {
                    importLang += `import * as ${value} from '${key}';\n`
                });    
            }
            text_1 = importLang + text_1;
            text_1 = optimizeCode(text_1);
            sourceModifier.fileExtension.set(filename, text_1);
            // console.log(`The file ${filename} extension: ${text_1}`);
        }
        return text_1;
    }

    writeExtensionFile (baseDir?: string) {
        var sourceModifier = process.sourceModifier ? process.sourceModifier : new SourceModifier();
        for (let [key, value] of sourceModifier.fileExtension) {
            baseDir = sourceModifier.entryDir;
            let filePath = path.join(baseDir, path.basename(key));
            sources[filePath] = value;
            // if (!fs.existsSync(path.dirname(filePath))) mkdirp(path.dirname(filePath));
            // fs.writeFileSync(filePath, value);
        }
    };

}