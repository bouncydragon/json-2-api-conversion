import {NextRequest, NextResponse} from "next/server";
import zod, {object, ZodTypeAny} from "zod";
import {type} from "os";

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

export const POST = async (req: NextRequest) => {

    const body = await req.json();

    const genericSchema = zod.object({
        data: zod.string(),
        format: zod.object({}).passthrough()
    });

    const { data, format } = genericSchema.parse(body);

    const dynamicSchema = jsonSchemaToZod(format);

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

    const validationResult = RetryablePromise.retry<object>(3, (resolve, reject) => {
        try {
            const res = "";
            const validationResult = dynamicSchema.parse(JSON.parse(res));
            return resolve(validationResult);
        } catch (e) {
            reject(e);
        }
    });

    return NextResponse.json(validationResult, { status: 200 });
}

