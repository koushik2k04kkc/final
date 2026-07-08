const axios = require("axios");
const env = require("../config/env");

const aiClient = axios.create({
  baseURL: env.AI_SERVICE_URL,
  timeout: 12000
});

async function analyzeFaceMatch({ selfiePath, nidImagePath }) {
  if (!selfiePath || !nidImagePath) {
    return {
      available: false,
      confidence: null,
      reason: "Selfie or NID image is missing"
    };
  }

  try {
    const response = await aiClient.post("/fraud/face-match", {
      selfiePath,
      nidImagePath
    });

    return {
      available: true,
      confidence: Number(response.data?.confidence || 0),
      reason: response.data?.reason || null
    };
  } catch (error) {
    return {
      available: false,
      confidence: null,
      reason: "AI face service unavailable"
    };
  }
}

async function analyzeDocumentForgery(documents = []) {
  try {
    const response = await aiClient.post("/fraud/document-forgery", {
      documents
    });

    return {
      tamperingScore: Number(response.data?.tamperingScore || 0),
      metadataMissing: Boolean(response.data?.metadataMissing),
      reasons: response.data?.reasons || []
    };
  } catch (error) {
    return {
      tamperingScore: 0,
      metadataMissing: false,
      reasons: ["AI document forgery service unavailable"]
    };
  }
}

async function extractOcrData(documentPath) {
  if (!documentPath) {
    return {
      available: false,
      text: "",
      data: {}
    };
  }

  try {
    const response = await aiClient.post("/ocr/extract", {
      documentPath
    });

    return {
      available: true,
      text: response.data?.text || "",
      data: response.data?.data || {}
    };
  } catch (error) {
    return {
      available: false,
      text: "",
      data: {}
    };
  }
}

module.exports = {
  analyzeFaceMatch,
  analyzeDocumentForgery,
  extractOcrData
};