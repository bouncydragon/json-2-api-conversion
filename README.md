## Getting Started

1. Clone the application.
2. Create an `.env` file and add your `API` key from [OpenAI](https://platform.openai.com/docs/overview)
```bash
OPEN_API_KEY="YOUR_KEY_HERE"
```
3. Install the required dependencies.
4. Run the application.

Open [http://localhost:3000/api/json](http://localhost:3000/api/json) in your Postman.

Enter this as your sample JSON format.
```json
{
    "data": "Reika is a 30 year old Software Developer",
    "format": {
        "name": {
            "type": "string"
        }
    }
}
```

## In Progress
- [ ] Fix open-ai api-key `error code: 429`
- [ ] Add design functionality
- [ ] Add unit test
- [ ] Add E2E test