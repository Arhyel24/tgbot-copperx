import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyD2ylbZ9lFyBA7KwnVmdxgRAoD_o_6tbpY");

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

interface AIResponse {
  command: string | null;
  intent: string;
}

export async function handleUserInput(userMessage: string): Promise<AIResponse> {
  try {
    const prompt = `usermessage: ${userMessage}. Understand what the user is trying to do and Match this request to one of these commands: start, menu, wallet, transfer, account, help, logout, main_menu, deposit, funds_transfer, view_wallets, check_balances, set_default_wallet, view_bank_account, transaction_history, transfer_email, transfer_wallet, transfer_bank, transfer_bulk, transfer_list, payees, add_payee, view_payees, edit_payee, delete_payee, view_profile, check_kyc, points. Respond only one matching command. Use this JSON format: { "command": "string",
      "intent": "string" } Return only the JSON object, nothing else.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    if (!result?.response?.candidates?.length) {
      throw new Error("Invalid response from AI model");
    }

    const candidate = result.response.candidates[0];
    if (!candidate?.content?.parts?.length) {
      throw new Error("Missing content in AI response");
    }

    let jsonString = candidate.content.parts[0].text!.trim();

    // Remove Markdown formatting if present
    jsonString = jsonString
      .replace(/^```json/, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    try {
      const parsedResult: AIResponse = JSON.parse(jsonString);
      return parsedResult;
    } catch (parseError) {
      console.error("Error parsing JSON response:", jsonString);
      return { command: null, intent: "Could not parse response" };
    }
  } catch (error: any) {
    console.error("Google Generative AI API Error:", error.message);
    return { command: null, intent: "An error occurred. Please try again." };
  }
}
