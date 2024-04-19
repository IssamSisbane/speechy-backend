import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { OPENAI_API_KEY } from "../config";
import OpenAI from "openai";


export async function speechyTranscription(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const formData: any = await request.formData();
    const file = formData.get('audio') as File;
    const lang = formData.get('lang') as string;

    console.log(file)

    try {
        const openai = new OpenAI({apiKey: OPENAI_API_KEY});

        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: "whisper-1",
            language: lang,
        });
        
        const systemPrompt = "You are a helpful assistant for me a cloud Engineer and a computer science student. Your task is to divide the following text (keeping all the informations) into logical paragraphs with a title for each. I want you to kepp all the informations I provide in your answer. Then you will summarize all the text and add some key points and questions. You will provide the result using markdown format.";
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            temperature: 0,
            messages: [
                {
                    role: "system",
                    content: systemPrompt,
                },
                {
                    role: "user",
                    content: transcription.text,
                }
            ]
        });
        return {
            jsonBody: {
                transcription: transcription.text,
                completion: completion.choices[0].message.content
            }
        };
    } catch (error) {
        console.error(error);
        return {
            status: 500,
            body: error
        };
    }
};

app.http('speechyTranscription', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: speechyTranscription
});
