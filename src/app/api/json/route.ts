import {NextRequest, NextResponse} from "next/server";
import zod, {object, ZodTypeAny} from "zod";
import {type} from "os";
import {openai} from "@/app/lib/openai";
import {CONTENT, EXAMPLE_ANSWER, EXAMPLE_PROMPT} from "@/app/api/json/example";

const determineSchemaType = (schema: any) => {
    if (!schema.hasOwnProperty("type")) {
        return Array.isArray(schema) ? "array" : typeof schema;
    }
    return schema.type;
}
const jsonSchemaToZod = (schema: any): ZodTypeAny => {
    const type = determineSchemaType(schema);

    switch (type) {
        case "string":
            return zod.string().nullable();
        case "number":
            return zod.number().nullable();
        case "boolean":
            return zod.boolean().nullable();
        case "array":
            return zod.array(jsonSchemaToZod(schema.items)).nullable();
        case "object":
            const shape: Record<string, ZodTypeAny> = {};

            for (const key in schema) {
                if (key !== "type") {
                    shape[key] = jsonSchemaToZod(schema[key])
                }
            }

            return zod.object(shape);
        default:
            throw new Error(`Unsupported data type: ${type}`);
    }
}

type PromiseExecutor<T> = (
    resolve: (value: T) => void,
    reject: (reason?: any) => void
) => void;

class RetryablePromise<T> extends Promise<T> {
    static async retry<T>(retries: number, executor: PromiseExecutor<T>): Promise<T> {
        return new RetryablePromise(executor).catch(err => {
            return retries > 0 ? RetryablePromise.retry(retries - 1, executor) : RetryablePromise.reject(err);
        })
    }
}

export const POST = async (req: NextRequest) => {

    const body = await req.json();

    const genericSchema = zod.object({
        data: zod.string(),
        format: zod.object({}).passthrough()
    });

    const {data, format} = genericSchema.parse(body);

    const dynamicSchema = jsonSchemaToZod(format);

    const content = CONTENT(data, format);

    const validationResult = await RetryablePromise.retry<string>(1, async (resolve, reject) => {
        try {
            const res = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "assistant",
                        content: "You are an AI that converts data into the attached JSON format. You respond nothing " +
                            "but valid JSON based on the input data. Your output should be DIRECTLY be valid JSON, " +
                            "nothing added before and after. You will begin with the opening curly brace and end with " +
                            "the closing brace. Only if absolutely cannot determine a field, use the value null.",
                    },
                    {
                        role: "user",
                        content: EXAMPLE_PROMPT
                    },
                    {
                        role: "user",
                        content: EXAMPLE_ANSWER
                    },
                    {
                        role: "user",
                        content
                    }
                ]
            });

            const text = res.choices[0].message.content;

            const validationResult = dynamicSchema.parse(JSON.parse(text || ""));
            return resolve(validationResult);
        } catch (e) {
            reject(e);
        }
    });

    return NextResponse.json(validationResult, {status: 200});
}

