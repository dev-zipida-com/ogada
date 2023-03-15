const defaultPrompt = (responseLanguage) => `
    Describe the topic below "---"
    Adhere to the options below.
    Tone: Friendly
    Style: Detailed
    Reader level: College student
    Length: 1200~1300 characters
    Perspective: Date planner
    Format : Output as a diagram
    Answer me in ${responseLanguage}
    ---
    Let's say you're my date course planner. I'll give you three date courses. I want you to write a recommendation on why each date course is good.
    Follow these conditions.
    1. Write a explanation of why you suggested each of the date courses. and each of the date courses that you suggested starts with the number like 1, 2, 3, and diagram. Next to each number, put a 1-2 word summary of why you recommended that dating course.
    2. the shops name must be written in the same way as the shop name in the list below. for example, "X1" is correct, but "x1 branch" is wrong.
    3. A Each date course that you suggest must have 5 shops. You should only use the shop informations that I gave you, and the order should be exactly as I suggested.
    4. the shop names must be written as that i gave to you, the Korean name of the shop.
    5. Anything above the sentence "and the shops are as follows:" should not be shown to me again.
    6. The very last line of text should end with "If there is anything else I can help you with, please enter it in the text box below".
    7. You must follow the format below.
        for example:
                1. Title
                    1. the shop name 1 (category)
                    2. the shop name 2 (category)
                    3. the shop name 3 (category)
                    4. the shop name 4 (category)
                    5. the shop name 5 (category)

                    explain about your suggestion of this date course.

                2. Title
                    1. the shop name 1 (category)
                    2. the shop name 2 (category)
                    3. the shop name 3 (category)
                    4. the shop name 4 (category)
                    5. the shop name 5 (category)

                    explain about your suggestion of this date course.

                3. Title
                    1. the shop name 1 (category)
                    2. the shop name 2 (category)
                    3. the shop name 3 (category)
                    4. the shop name 4 (category)
                    5. the shop name 5 (category)

                    explain about your suggestion of this date course.

                If there is anything else I can help you with, please enter it in the text box below.

    and the shops are as follows:

    `;

const RECOMMENDED_MSG = `Recommend only one more new dating course with the data under "---", based on the format I've already provided. You should only use the 5 shop information that newly added at this time, and the order should be exactly as I suggested.  \n---\n`;

export default class ChatGpt {
  constructor() {
    this.reset();
  }

  reset() {
    this.language = "English";
    this.repeatCounter = 0;
    this.messages = [];
  }

  setDefaultMessage(content) {
    this.messages = [
      {
        role: "user",
        content: defaultPrompt(this.language) + content,
      },
    ];
  }

  addAssistantMessage(content) {
    this.messages.push({
      role: "assistant",
      content,
    });
  }

  addRecomandationMessage(content) {
    if (this.messages.length === 0) {
      this.setDefaultMessage(content);
      return;
    }

    this.messages.push({
      role: "user",
      content: RECOMMENDED_MSG + content,
    });
  }

  /**
   * Ask the question to the GPT-3.5 API
   * @returns {Promise<ReadableStreamDefaultReader<Uint8Array>>}
   */
  async askQuestion() {
    if (this.messages.length === 0) {
      throw new Error("No message to ask");
    }

    const config = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: this.messages,
        stream: true,
        temperature: 0.5,
      }),
    };

    const res = await fetch(
      "https://api.openai.com/v1/chat/completions",
      config
    );

    return res.body.getReader();
  }

  /**
   * Get the answer from the GPT-3.5 API
   * @param {ReadableStreamDefaultReader<Uint8Array>} reader
   * @returns {AsyncGenerator<string, void, unknown>}
   */
  async *readAnswer(reader) {
    const decoder = new TextDecoder("utf-8");

    let lastChunk = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        this.addAssistantMessage(lastChunk + "\n\n");

        yield "\n\n";
        break;
      }

      const decodedText = decoder.decode(value).split(`\n\n`).at(0);

      const data = decodedText.split("data: ").at(1);
      if (data === "[DONE]") {
        break;
      }

      const response = JSON.parse(data);
      const content = response.choices?.[0]?.delta?.content;

      if (content && content !== "\n\n") {
        lastChunk += content;

        yield content;
      }
    }
  }
}
