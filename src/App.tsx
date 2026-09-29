/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  ImageIcon, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Trash2, 
  Camera, 
  Package, 
  ArrowRight, 
  ArrowLeft,
  Video, 
  Mic, 
  Hand, 
  Shirt, 
  Smartphone, 
  ChevronLeft,
  Settings,
  Layout,
  Layers,
  CheckCircle2,
  Monitor,
  Maximize2,
  Loader2,
  Aperture,
  Sliders,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  Eye,
  Copy,
  FileText,
  Edit3,
  Volume2,
  Wand2,
  PlayCircle,
  Footprints,
  Watch,
  Pocket,
  UserCheck,
  ShieldCheck,
  Film
} from 'lucide-react';
import { GoogleGenAI, Type, Modality } from "@google/genai";
import JSZip from 'jszip';
import { motion, AnimatePresence } from "motion/react";
import { 
  fetchWithRetry, 
  playClick, 
  playStartupSound,
  safeCopyToClipboard, 
  processImageForDownload, 
  resizeImage,
  base64ToWavUrl 
} from './utils';
import { 
  GENERATIVE_MODEL, 
  TEXT_MODEL, 
  TTS_MODEL, 
  VIDEO_MODEL,
  MODE_BACKGROUNDS, 
  VOICES, 
  TONES, 
  MODES, 
  RATIOS, 
  SCENE_COUNTS,
  CHAR_HAIR_OPTIONS,
  CHAR_OUTFIT_OPTIONS,
  CHAR_AGE_OPTIONS,
  CHAR_ETHNICITY_OPTIONS,
  CHAR_BODY_OPTIONS,
  CHAR_EYE_OPTIONS,
  CHAR_EXPRESSION_OPTIONS,
  CHAR_FACE_DETAIL_OPTIONS
} from './constants';
import { REALISM_LAWS, IDENTITY_LOCK, PRODUCT_CONSISTENCY, getModeLogic } from './logic';
import { 
  GeneratingState, 
  LayoutWrapper, 
  Navbar, 
  SectionTitle, 
  UploadZone, 
  ButtonCTA,
  CooldownBadge,
  DraggableBackButton
} from './components/UI';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Utility to sleep
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to execute API calls with retry for 429
async function executeWithRetry(apiCall: () => Promise<any>, maxRetries = 3) {
  let lastError: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await apiCall();
    } catch (err: any) {
      lastError = err;
      const isRateLimit = err?.message?.includes('429') || 
                          err?.status === 429 || 
                          JSON.stringify(err).includes('429') ||
                          JSON.stringify(err).includes('RESOURCE_EXHAUSTED');
      
      if (isRateLimit && i < maxRetries) {
        const delay = (i + 1) * 3000; // 3s, 6s, 9s
        console.warn(`Rate limit hit (429). Retrying in ${delay/1000}s...`);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
}

export default function App() {
  const [view, setView] = useState('welcome');
  const [selectedMode, setSelectedMode] = useState<any>(null);
  
  // Data State
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [guestModelImage, setGuestModelImage] = useState<string | null>(null);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [dynamicBackgrounds, setDynamicBackgrounds] = useState<string[]>(MODE_BACKGROUNDS.ugc);

  // Character Customize State
  const [charIdentity, setCharIdentity] = useState('exact'); // 'exact' or 'inspired'
  const [charGender, setCharGender] = useState('Female');
  const [charHair, setCharHair] = useState(CHAR_HAIR_OPTIONS[0]);
  const [charOutfit, setCharOutfit] = useState(CHAR_OUTFIT_OPTIONS[0]);
  const [charAge, setCharAge] = useState(CHAR_AGE_OPTIONS[0]);
  const [charEthnicity, setCharEthnicity] = useState(CHAR_ETHNICITY_OPTIONS[0]);
  const [charBody, setCharBody] = useState(CHAR_BODY_OPTIONS[0]);
  const [charEyes, setCharEyes] = useState(CHAR_EYE_OPTIONS[0]);
  const [charExpression, setCharExpression] = useState(CHAR_EXPRESSION_OPTIONS[0]);
  const [charFaceDetails, setCharFaceDetails] = useState(CHAR_FACE_DETAIL_OPTIONS[0]);

  // Custom Background State
  const [bgType, setBgType] = useState('preset'); 
  const [customBg, setCustomBg] = useState("");

  // flow State
  const [isAnalyzingProduct, setIsAnalyzingProduct] = useState(false);
  const [isProductConfirmed, setIsProductConfirmed] = useState(false);

  // Biru Glossy (Glass Apple) unified input styling
  const themeInputClass = "bg-slate-950/70 backdrop-blur-xl border border-blue-500/25 text-white placeholder:text-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] transition-all relative z-10";

  const [config, setConfig] = useState({
    background: MODE_BACKGROUNDS.ugc[0],
    ratio: '9:16',
    scenes: 1,
    ugcStyle: 'Handheld',
    campaignPrompt: ""
  });

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [sceneLoadings, setSceneLoadings] = useState<Record<number, boolean>>({});
  const [videoLoadings, setVideoLoadings] = useState<Record<number, boolean>>({});
  const [audioLoadings, setAudioLoadings] = useState<Record<number, boolean>>({});
  const [scenePrompts, setScenePrompts] = useState<Record<number, string>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<number, boolean>>({});

  // Audio Maker State
  const [showVideoGenerators, setShowVideoGenerators] = useState(false);
  const [isAudioStudioOpen, setIsAudioStudioOpen] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isAudioStudioMinimized, setIsAudioStudioMinimized] = useState(false);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const [globalError, setGlobalError] = useState<string | null>(null);

  const [voScript, setVoScript] = useState("");
  const [voDuration, setVoDuration] = useState("15s");
  const [voVoice, setVoVoice] = useState(VOICES[0].id);
  const [voTone, setVoTone] = useState(TONES[1]);
  const [voAudioUrl, setVoAudioUrl] = useState<string | null>(null);
  const [isGeneratingVOScript, setIsGeneratingVOScript] = useState(false);
  const [isGeneratingVOAudio, setIsGeneratingVOAudio] = useState(false);

  const modelInputRef = useRef<HTMLInputElement>(null);
  const guestModelInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);

  const handleResetAndNew = () => {
    playClick();
    setSelectedMode(null);
    setModelImage(null);
    setGuestModelImage(null);
    setProductImage(null);
    setProductName("");
    setProductDesc("");
    setCharIdentity('exact');
    setCharHair('');
    setCharOutfit('');
    setCharAge('');
    setCharEthnicity('');
    setCharBody('');
    setCharEyes('');
    setCharExpression('');
    setCharFaceDetails('');
    setIsProductConfirmed(false);
    setBgType('preset');
    setCustomBg("");
    setConfig({
      background: MODE_BACKGROUNDS.ugc[0],
      ratio: '9:16',
      scenes: 1,
      ugcStyle: 'Handheld',
      campaignPrompt: ""
    });
    setGeneratedImages([]);
    setSceneLoadings({});
    setVideoLoadings({});
    setAudioLoadings({});
    setScenePrompts({});
    setPreviewImage(null);
    setCopiedStates({});
    setVoScript("");
    setVoAudioUrl(null);
    setGlobalError(null);
    setIsAudioStudioOpen(false);
    setIsAudioStudioMinimized(false);
    setView('mode-selection');
  };

  const updateSceneData = (index: number, updates: any) => {
    setGeneratedImages(prev => {
        const newArr = [...prev];
        if (newArr[index]) {
            newArr[index] = { ...newArr[index], ...updates };
        }
        return newArr;
    });
  };

  const handleCopyPrompt = (index: number) => {
    playClick();
    const sceneData = generatedImages[index];
    if (!sceneData) return;

    let contextLogic = "";
    if (sceneData.voActive) {
        if (sceneData.isBRoll) {
            contextLogic = `NARRATIVE VOICE-OVER: '${sceneData.voText}'. Product remains the main focus.`;
        } else {
            contextLogic = `LIP-SYNC: Model is speaking, mouth moving precisely to dialogue: '${sceneData.voText}'.`;
        }
    } else {
        contextLogic = sceneData.isBRoll ? "AMBIENT: No human visible, purely product focused." : "AMBIENT: Mouth closed or natural breathing, no talking.";
    }

    const dynamicPrompt = `PROMPT: ${sceneData.videoMotion} CAMERA: ${sceneData.videoCamera} DETAILS: Photorealistic high-fidelity video generation. Maintain strict consistency with the provided image reference. CONTEXT: ${contextLogic} ENVIRONMENT: ${sceneData.activeBackground}. NEGATIVE: distortion, morphing, bad hands, text overlays.`;

    safeCopyToClipboard(dynamicPrompt);
    setCopiedStates(prev => ({ ...prev, [index]: true }));
    setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [index]: false }));
    }, 2000);
  };

  const analyzeProductImage = async (originalBase64: string) => {
    setIsAnalyzingProduct(true);
    setProductName("");
    setProductDesc("");
    try {
        // High Speed Optimization: Resize image before analysis
        const resizedBase64 = await resizeImage(originalBase64, 512, 512);
        const imageBase64 = resizedBase64.split(',')[1];
        
        const analyzeAi = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || "" });

        const modeTitle = selectedMode?.title || 'Komersial';
        const systemPrompt = `
        Tugas Anda adalah menganalisis gambar produk dan mengembalikan HANYA format JSON valid.
        1. "productName": Identifikasi produk, maksimal 3 kata (Bahasa Indonesia).
        2. "productDesc": Deskripsi SANGAT RINGKAS (kategori, merek, warna/ciri menonjol, dan estimasi ukuran fisik produk tersebut jika dibandingkan dengan tangan manusia).
        3. "backgrounds": Array berisi 7 rekomendasi latar/background yang eksklusif & estetik untuk sesi ${modeTitle} produk tersebut di Indonesia.
        `;

        const response = await analyzeAi.models.generateContent({
            model: TEXT_MODEL,
            contents: [{
                parts: [
                    { text: systemPrompt },
                    { inlineData: { mimeType: "image/png", data: imageBase64 } }
                ]
            }],
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        productName: { type: Type.STRING },
                        productDesc: { type: Type.STRING },
                        backgrounds: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["productName", "productDesc", "backgrounds"]
                }
            }
        });

        const text = response.text;
        if (text) {
            const data = JSON.parse(text);
            setProductName(data.productName || "Produk Terdeteksi");
            setProductDesc(data.productDesc || "Detail produk.");
            const baseBgs = selectedMode ? (MODE_BACKGROUNDS as any)[selectedMode.id] : MODE_BACKGROUNDS.ugc;
            if (data.backgrounds && Array.isArray(data.backgrounds) && data.backgrounds.length > 0) {
                const mergedBackgrounds = Array.from(new Set([...data.backgrounds, ...baseBgs])) as string[];
                setDynamicBackgrounds(mergedBackgrounds);
                setConfig(prev => ({...prev, background: data.backgrounds[0] || mergedBackgrounds[0]}));
                setBgType('preset');
            } else {
                setDynamicBackgrounds(baseBgs);
                setConfig(prev => ({...prev, background: baseBgs[0]}));
            }
        }
    } catch (error: any) {
        console.error("Product analysis error:", error);
        setGlobalError("AI tidak dapat menganalisis gambar secara otomatis. Anda dapat melengkapi informasi produk secara manual.");
        setProductName("Produk Manual");
        setProductDesc("Silakan lengkapi deskripsi produk secara manual.");
        const baseBgs = selectedMode ? (MODE_BACKGROUNDS as any)[selectedMode.id] : MODE_BACKGROUNDS.ugc;
        setDynamicBackgrounds(baseBgs);
        setConfig(prev => ({...prev, background: baseBgs[0]}));
    } finally {
        setIsAnalyzingProduct(false);
    }
  };

  const handleProductUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    playClick();
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProductImage(base64);
        setIsProductConfirmed(false);
        analyzeProductImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    playClick();
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setModelImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGuestModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    playClick();
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setGuestModelImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const generateScripts = async () => {
      let toneInstruction = "Gaya bahasa yang natural, santai, dan menarik.";
      let narrativeArc = "Alur cerita yang mengalir secara natural dari awal sampai akhir.";

      if (selectedMode?.id === 'ugc') {
          toneInstruction = "Gaya bahasa UGC: Santai, jujur, seperti testimoni pribadi, tidak kaku, bahasa gaul yang sopan.";
          narrativeArc = `SEMUA SCENE WAJIB BERGAYA UGC (Model berbicara langsung ke kamera). Fokus pada ekspresi wajah dan interaksi langsung dengan penonton.`;
      }

      const prompt = `Generate a JSON object with a single key 'scenes' containing an array of precisely ${config.scenes} objects for a storyboard about ${productName} (${productDesc}). ${config.campaignPrompt ? `Context: ${config.campaignPrompt}.` : ""} ${narrativeArc} 
      IMPORTANT: Use Bahasa Indonesia for the 'script' field. ${toneInstruction} 

      Each scene object MUST have:
      1. 'script': The spoken narration (short and engaging).
      2. 'visual_description': A natural visual description for a smartphone photo. Focus on candid poses and realistic environments.
      3. 'camera_angle': Camera angle (e.g., 'Close-up', 'Medium shot').
      4. 'motion': Video motion (e.g., 'Slow zoom', 'Pan').`;

      try {
          const scriptsAi = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || "" });
          const response = await executeWithRetry(() => scriptsAi.models.generateContent({
            model: TEXT_MODEL,
            contents: [{ parts: [{ text: prompt }] }],
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        scenes: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT,
                                properties: {
                                    script: { type: Type.STRING },
                                    visual_description: { type: Type.STRING },
                                    camera_angle: { type: Type.STRING },
                                    motion: { type: Type.STRING }
                                },
                                required: ["script", "visual_description", "camera_angle", "motion"]
                            } 
                        }
                    },
                    required: ["scenes"]
                }
            }
          }));
          const text = response.text;
          if (text) {
              const data = JSON.parse(text);
              if (data.scenes && data.scenes.length > 0) {
                  return data.scenes;
              }
          }
      } catch (err: any) {
          console.error("Script gen error", err);
          setGlobalError("Gagal menyusun naskah otomatis. Sistem akan menggunakan naskah template untuk saat ini.");
      }
      return Array.from({ length: config.scenes }).map((_, i) => ({
          script: `Scene ${i+1}: Narasi visual untuk ${productName}.`,
          visual_description: `Menampilkan ${productName} dalam setting profesional & estetik.`,
          camera_angle: "Medium shot",
          motion: "Slow cinematic pan"
      }));
  };

  const generateVisual = async () => {
    playClick(); 
    setIsGenerating(true);
    setGlobalError(null);
    setGeneratedImages(new Array(config.scenes).fill(null)); 
    setSceneLoadings({});
    setScenePrompts({});
    setCopiedStates({});
    setView('result');

    try {
      const activeBackground = bgType === 'custom' ? (customBg || 'Studio Foto Polos') : config.background;
      const scenesData = await generateScripts();
      const imageAi = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || "" });

      // HIGH SPEED OPTIMIZATION: Resize references once before parallel batch
      const resizedModel = modelImage ? await resizeImage(modelImage, 768, 768) : null;
      const resizedProduct = productImage ? await resizeImage(productImage, 768, 768) : null;
      
      const base64Model = resizedModel ? resizedModel.split(',')[1] : null;
      const base64ProductRaw = resizedProduct ? resizedProduct.split(',')[1] : null;

      // STABILITY OPTIMIZATION: Sequential processing one by one to strictly avoid 429 Rate Limit errors
      for (let i = 0; i < config.scenes; i++) {
        // Add a safety pause between images to prevent rate limiting
        if (i > 0) await sleep(2500);

        try {
          const sceneInfo = scenesData[i] || { script: `Scene ${i+1}`, visual_description: "", camera_angle: "", motion: "" };
          const scriptText = sceneInfo.script;
          const isBRoll = (i % 3 === 2) && (i !== config.scenes - 1) && (selectedMode?.id !== 'ugc');
          
          let role = isBRoll ? "B-ROLL DETAIL" : `ACT ${i + 1}`;
          if (i === 0) role = "HOOK";
          if (i === config.scenes - 1) role = "CTA";

          const modeParams = getModeLogic(
            selectedMode?.id, 
            i, 
            productName, 
            productDesc, 
            activeBackground, 
            config.ugcStyle,
            {
                identity: charIdentity,
                gender: charGender,
                hair: charHair,
                outfit: charOutfit,
                age: charAge,
                ethnicity: charEthnicity,
                body: charBody,
                eyes: charEyes,
                expression: charExpression,
                faceDetails: charFaceDetails,
                hasModel: !!modelImage
            }
          );
          
          let rolePrefix = isBRoll ? "PRO CINEMATOGRAPHER TASK:" : "AMATEUR UGC PHOTO TASK: Capture a raw, unedited social media photo. ABSOLUTE FACE CONSISTENCY REQUIRED.";
          let sceneScript = `SCENE CONTEXT: ${scriptText}. (DO NOT RENDER ANY TEXT, WORDS, OR SUBTITLES ON THE IMAGE)`;
          let colorGrading = "Natural iPhone color processing, realistic highlights and shadows.";

          let environmentText = `ENVIRONMENT: ${activeBackground}.`;
          if (selectedMode?.id === 'selfie') {
              environmentText += ` MIRROR SETTING: The mirror is located in the ${activeBackground}. The reflection MUST clearly show the ${activeBackground} environment to maintain consistency.`;
          }

          let payloadParts: any[] = [];
          
          // Index 0: Human Reference (PRIORITY)
          if (base64Model && (selectedMode?.id !== 'pov')) {
              payloadParts.push({ text: "REFERENCE IMAGE 1 (PERSON IDENTITY): THE GENERATED IMAGE MUST FEATURE THIS EXACT PERSON WITH 100% ACCURACY. NO ALTERATIONS TO FACE OR IDENTITY." });
              payloadParts.push({ inlineData: { mimeType: "image/png", data: base64Model } });
          }

          // Index 2: Product Reference
          if (base64ProductRaw && (selectedMode?.id !== 'model')) {
              payloadParts.push({ text: `REFERENCE IMAGE ${payloadParts.length > 0 ? 2 : 1} (PRODUCT): THE GENERATED IMAGE MUST FEATURE THIS EXACT PRODUCT WITH 100% ACCURACY. NO ALTERATIONS TO COLOR, SHAPE, OR BRANDING.` });
              payloadParts.push({ inlineData: { mimeType: "image/png", data: base64ProductRaw } });
          }

          let realismIdentity = `${REALISM_LAWS}`;
          let modelRefIndex = -1;
          let productRefIndex = -1;
          
          if (modelImage && (selectedMode?.id !== 'pov')) {
             modelRefIndex = payloadParts.findIndex(p => p.inlineData) + 1; // 1-indexed for Gemini
          }
          
          if (productImage && (selectedMode?.id !== 'model')) {
             // Find the last image index which is product
             const indices = payloadParts.map((p, idx) => p.inlineData ? idx + 1 : -1).filter(idx => idx !== -1);
             productRefIndex = indices[indices.length - 1]; 
          }

          if (!isBRoll && selectedMode?.id !== 'pov' && modelRefIndex !== -1) {
              const identityPrompt = modeParams.identityConstraint.replace('REFERENCE IMAGE 1', `REFERENCE IMAGE ${modelRefIndex}`);
              realismIdentity += ` ${identityPrompt}`;
          }
          
          if (selectedMode?.id !== 'model' && productRefIndex !== -1) {
            const productPrompt = PRODUCT_CONSISTENCY.replace('REFERENCE IMAGE 2', `REFERENCE IMAGE ${productRefIndex}`);
            realismIdentity += ` ${productPrompt}`;
          }

          let finalMandatory = "NO TEXT OR OVERLAYS ALLOWED.";
          if (modelRefIndex !== -1) {
              finalMandatory += ` THE FACE IN THE RESULT MUST BE A 100% IDENTICAL CLONE OF REFERENCE IMAGE ${modelRefIndex}.`;
          }
          if (productRefIndex !== -1) {
              finalMandatory += ` THE PRODUCT IN THE RESULT MUST BE A 100% IDENTICAL CLONE OF REFERENCE IMAGE ${productRefIndex}.`;
          }

          let globalNeg = ", text, watermark, logo, UI, buttons, icons, hearts, comments, overlay, subtitles, captions, words, letters, typography, visual effects, digital overlays, graphics, banners, stickers, AI, AI generated look, midjourney, stable diffusion, unreal engine, 3d, render, CGI, flawless perfect lighting, cinematic movie shot, professional photography, DSLR, 8k, high res, studio flash, plastic skin, airbrushed, doll-like, HDR, glossy, over-saturated, excessively symmetrical face, beauty filter, floating product, bad product integration, blurry product labels, mannequin, uncanny valley, digital art, computer graphics, fake skin, plastic texture";
          let diffusionPrompt = `${realismIdentity} ${rolePrefix} ${sceneScript} ${colorGrading} ${modeParams.cameraLogic} ${modeParams.subjectPrompt} ${environmentText} FINAL_MANDATORY_INSTRUCTION: ${finalMandatory} NEGATIVE: ${modeParams.negPrompt} ${globalNeg}`;
          payloadParts.push({ text: diffusionPrompt });

          const response = await executeWithRetry(() => imageAi.models.generateContent({
            model: GENERATIVE_MODEL,
            contents: [{ parts: payloadParts }],
            config: { 
              systemInstruction: "CRITICAL: You are an iPhone 15 Pro camera. Your absolute priority is 100% FACE, GENDER, HAIR, AND PRODUCT CONSISTENCY. The person in the generated image MUST be an identical clone of REFERENCE IMAGE 1 (MATCH GENDER, HAIR, FACE SHAPE, AND POSTURE EXACTLY). The product in the generated image MUST be an identical clone of REFERENCE IMAGE 2. MAINTAIN EXACT SCALE AND PROPORTIONS. The product's size must be realistic and consistent across all scenes. No alterations allowed. The style is RAW, UNEDITED, and AUTHENTIC IPHONE PHOTOGRAPHY. LIGHTING: Use natural, realistic lighting (indoor room light or natural daylight) to ensure a raw, unedited look. Avoid overly dramatic or cinematic lighting effects. Every scene must feature the EXACT same person and the EXACT same product. NO GENDER SWAPPING.",
              imageConfig: {
                aspectRatio: config.ratio as any 
              }
            }
          }));

          const base64Output = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
          if (base64Output) {
            const imgSrc = `data:image/png;base64,${base64Output}`;
            const defaultVoActive = !isBRoll && (selectedMode?.id === 'ugc');
            const scenarioData = { 
                src: imgSrc, role, action: modeParams.subjectPrompt, scriptHint: scriptText,
                videoMotion: modeParams.motionCamera, videoCamera: modeParams.cameraLogic, activeBackground, isBRoll,
                voActive: defaultVoActive, voText: scriptText
            };
            setGeneratedImages(prev => {
               const newArr = [...prev];
               newArr[i] = scenarioData;
               return newArr;
            });
          }
        } catch (err: any) {
          console.error(`Scene ${i} failed:`, err);
          const isQuotaError = JSON.stringify(err).includes('RESOURCE_EXHAUSTED') || JSON.stringify(err).includes('quota');
          if (isQuotaError) {
             setGlobalError(`Kuota Gemini API telah mencapai limit. Silakan upgrade ke Google AI Studio Pay-as-you-go untuk melanjutkan generasi.`);
             break; // Stop loop if quota is empty
          } else {
             setGlobalError(`Gagal membuat gambar untuk adegan ke-${i+1}. Anda dapat melakukan regenerasi adegan ini.`);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setGlobalError("Terjadi kendala saat memproses pembuatan kampanye. Silakan periksa koneksi atau unggah ulang aset Anda.");
    } finally {
      setIsGenerating(false);
      setCooldown(90);
    }
  };

  const regenerateSingleScene = async (index: number, customInstruction?: string) => {
    playClick();
    
    if (customInstruction) {
        // Update Prompt case: Don't regenerate image, just update state and feedback
        setSceneLoadings(prev => ({ ...prev, [index]: true }));
        await new Promise(resolve => setTimeout(resolve, 600));
        updateSceneData(index, { voText: customInstruction });
        setSceneLoadings(prev => ({ ...prev, [index]: false }));
        return;
    }

    const revisionInstruction = scenePrompts[index] || "";
    const originalScenario = generatedImages[index]; 
    const activeBackground = bgType === 'custom' ? (customBg || 'Studio Foto Polos') : config.background;
    
    setSceneLoadings(prev => ({ ...prev, [index]: true }));
    setGlobalError(null);

    try {
      const resizedModel = modelImage ? await resizeImage(modelImage, 768, 768) : null;
      const resizedProduct = productImage ? await resizeImage(productImage, 768, 768) : null;
      
      const base64Model = resizedModel ? resizedModel.split(',')[1] : null;
      const base64ProductRaw = resizedProduct ? resizedProduct.split(',')[1] : null;

      const imageAi = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || "" });

      let envDetails = `Background: ${activeBackground}.`;
      if (selectedMode?.id === 'selfie') {
          envDetails += " FIXED MIRROR ROOM DETAILS: To ensure 100% background consistency, the room MUST feature these exact elements in the reflection: a minimalist modern bedroom with a cream-colored wall, a small wooden bedside table with a warm lamp on the left, and a large floor-to-ceiling mirror with a thin black frame. The lighting is soft natural window light from the right side.";
      }

      const payloadParts: any[] = [];
      if (base64Model && (selectedMode?.id !== 'pov')) {
          payloadParts.push({ text: "REFERENCE IMAGE 1 (PERSON IDENTITY): THE GENERATED IMAGE MUST FEATURE THIS EXACT PERSON WITH 100% ACCURACY." });
          payloadParts.push({ inlineData: { mimeType: "image/png", data: base64Model } });
      }
      if (base64ProductRaw && (selectedMode?.id !== 'model')) {
          payloadParts.push({ text: `REFERENCE IMAGE ${payloadParts.length > 0 ? 2 : 1} (PRODUCT): THE GENERATED IMAGE MUST FEATURE THIS EXACT PRODUCT WITH 100% ACCURACY.` });
          payloadParts.push({ inlineData: { mimeType: "image/png", data: base64ProductRaw } });
      }

      let modelRefIndex = -1;
      let productRefIndex = -1;
      
      if (modelImage && (selectedMode?.id !== 'pov')) {
         modelRefIndex = payloadParts.findIndex(p => p.inlineData) + 1; // 1-indexed for Gemini
      }
      
      if (productImage && (selectedMode?.id !== 'model')) {
         const indices = payloadParts.map((p, idx) => p.inlineData ? idx + 1 : -1).filter(idx => idx !== -1);
         productRefIndex = indices[indices.length - 1]; 
      }

      let realismIdentity = `${REALISM_LAWS}`;
      if (selectedMode?.id !== 'pov' && modelRefIndex !== -1) {
          const identityPrompt = IDENTITY_LOCK.replace('REFERENCE IMAGE 1', `REFERENCE IMAGE ${modelRefIndex}`);
          realismIdentity += ` ${identityPrompt}`;
      }
      if (selectedMode?.id !== 'model' && productRefIndex !== -1) {
          const productPrompt = PRODUCT_CONSISTENCY.replace('REFERENCE IMAGE 2', `REFERENCE IMAGE ${productRefIndex}`);
          realismIdentity += ` ${productPrompt}`;
      }

      let finalMandatory = "NO TEXT OR OVERLAYS ALLOWED.";
      if (modelRefIndex !== -1) {
          finalMandatory += ` THE FACE IN THE RESULT MUST BE A 100% IDENTICAL CLONE OF REFERENCE IMAGE ${modelRefIndex}.`;
      }
      if (productRefIndex !== -1) {
          finalMandatory += ` THE PRODUCT IN THE RESULT MUST BE A 100% IDENTICAL CLONE OF REFERENCE IMAGE ${productRefIndex}.`;
      }

      const systemPrompt = `
      REVISION MODE. Target: Regenerate Scene ${index + 1}.
      Product: ${productName} (${productDesc})
      User Instruction: ${revisionInstruction || "Improve lighting and expression."}
      Keep original action: ${originalScenario.action || "Showing the product"}. ${envDetails}
      ${realismIdentity}
      MANDATORY: ${finalMandatory}
      MANDATORY: NO TEXT, NO OVERLAYS, NO UI. SINGLE HARSH LIGHT ONLY.
      NEGATIVE: AI, midjourney, stable diffusion, unreal engine, 3d, render, CGI, plastic skin, airbrushed, doll-like, excessively symmetrical face, beauty filter, low quality, blurry, distorted, watermark, text, logo, floating product, bad product integration, blurry product labels, UI, captions, subtitles.
      `;

      payloadParts.push({ text: systemPrompt });

      const response = await imageAi.models.generateContent({
        model: GENERATIVE_MODEL,
        contents: [{ parts: payloadParts }],
          config: { 
          systemInstruction: `CRITICAL: You are an iPhone 15 Pro camera. Your absolute priority is 100% FACE AND PRODUCT CONSISTENCY. ${modelRefIndex !== -1 ? `The face in the generated image MUST be an identical clone of REFERENCE IMAGE ${modelRefIndex}.` : ""} ${productRefIndex !== -1 ? `The product in the generated image MUST be an identical clone of REFERENCE IMAGE ${productRefIndex}.` : ""} MAINTAIN EXACT SCALE AND PROPORTIONS. The product's size must be realistic and consistent across all scenes. No alterations allowed. The style is RAW, UNEDITED, and AUTHENTIC IPHONE PHOTOGRAPHY. LIGHTING: Use a single harsh light source to create strong shadows and high contrast. Every scene must feature the EXACT same person and the EXACT same product.`,
          imageConfig: {
            aspectRatio: config.ratio as any 
          }
        }
      });

      const base64Output = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
      if (base64Output) {
        const imgSrc = `data:image/png;base64,${base64Output}`;
        setGeneratedImages(prev => {
          const newArr = [...prev];
          newArr[index] = { ...newArr[index], src: imgSrc }; 
          return newArr;
        });
        setScenePrompts(prev => ({ ...prev, [index]: "" }));
      }
    } catch (err: any) {
      console.error("Scene regeneration error:", err);
      setGlobalError("Gagal memperbarui adegan. Silakan coba sesaat lagi.");
    } finally {
      setSceneLoadings(prev => ({ ...prev, [index]: false }));
      setCooldown(30);
    }
  };

  const handleGenerateVOScript = async () => {
      playClick();
      setIsGeneratingVOScript(true);
      const prompt = `Buatkan naskah master voiceover gaya ${selectedMode?.title || 'Komersial'} untuk ${productName || 'Produk'}. Durasi: ${voDuration}. Bahasa Indonesia. HANYA berikan teks naskahnya saja tanpa penjelasan, tanda kutip di awal/akhir, atau teks tambahan lainnya.`;
      try {
          const response = await ai.models.generateContent({
              model: TEXT_MODEL,
              contents: [{ parts: [{ text: prompt }] }]
          });
          const text = response.text;
          if (text) setVoScript(text.trim());
      } catch (err: any) {
          console.error("Master VO Script gen error", err);
          setGlobalError("Gagal membuat naskah Voiceover otomatis. Silakan tulis naskah Anda sendiri di kolom yang tersedia.");
      } finally {
          setIsGeneratingVOScript(false);
          setCooldown(10);
      }
  };

  const handleGenerateVOAudio = async () => {
      if (!voScript) return;
      playClick();
      setIsGeneratingVOAudio(true);
      setVoAudioUrl(null);

      try {
          const response = await ai.models.generateContent({
            model: TTS_MODEL,
            contents: [{ parts: [{ text: `Bacakan dengan nada ${voTone}: ${voScript}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voVoice }
                    }
                }
            }
          });

          const base64PCM = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (base64PCM) {
              const url = base64ToWavUrl(base64PCM);
              setVoAudioUrl(url);
          }
      } catch (err) {
          console.error("Audio generation failed:", err);
      } finally {
          setIsGeneratingVOAudio(false);
          setCooldown(15);
      }
  };

  const handleGenerateSceneAudio = async (index: number) => {
    const scene = generatedImages[index];
    if (!scene || !scene.voText) return;
    
    playClick();
    setAudioLoadings(prev => ({ ...prev, [index]: true }));
    setGlobalError(null);
    
    try {
        const response = await ai.models.generateContent({
            model: TTS_MODEL,
            contents: [{ parts: [{ text: `Bacakan dengan nada ${voTone}: ${scene.voText}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voVoice }
                    }
                }
            }
        });

        const base64PCM = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64PCM) {
            const audioUrl = base64ToWavUrl(base64PCM);
            updateSceneData(index, { audioUrl });
        }
    } catch (err: any) {
        console.error("Scene audio generation failed:", err);
        setGlobalError("Gagal mengubah naskah menjadi suara. Silakan coba opsi suara atau nada bicara lain.");
    } finally {
        setAudioLoadings(prev => ({ ...prev, [index]: false }));
        setCooldown(15);
    }
  };

  const handleGenerateVideo = async (index: number) => {
    const scene = generatedImages[index];
    if (!scene || !scene.src) return;
    
    playClick();
    setVideoLoadings(prev => ({ ...prev, [index]: true }));
    setGlobalError(null);
    
    try {
        // Create a new instance right before call as per skill guidance
        const videoAi = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || "" });
        
        const base64Image = scene.src.split(',')[1];
        const prompt = `ULTRA-REALISTIC VIDEO GENERATION. Create a high-quality, cinematic video based on this image. ${scene.videoMotion || "Slow cinematic pan."} ${scene.videoCamera || "Handheld smartphone style."} Maintain 100% pixel-perfect consistency with the image. Ensure natural lighting, realistic textures, and fluid motion. No flickering, no artifacts. Professional grade output.`;
        
        let operation = await videoAi.models.generateVideos({
            model: VIDEO_MODEL,
            prompt: prompt,
            image: {
                imageBytes: base64Image,
                mimeType: 'image/png',
            },
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: config.ratio === '9:16' ? '9:16' : config.ratio === '16:9' ? '16:9' : '16:9'
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await videoAi.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
            const response = await fetch(downloadLink, {
                method: 'GET',
                headers: {
                    'x-goog-api-key': process.env.API_KEY || process.env.GEMINI_API_KEY || "",
                },
            });
            
            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error("PERMISSION_DENIED: Akses Video AI memerlukan kuota model video khusus dari Google AI Studio.");
                }
                throw new Error(`Failed to fetch video: ${response.statusText}`);
            }

            const blob = await response.blob();
            const videoUrl = URL.createObjectURL(blob);
            
            updateSceneData(index, { videoUrl });
        }
    } catch (err: any) {
        console.error("Video generation failed:", err);
        if (err.message?.includes("Requested entity was not found")) {
            setGlobalError("Sesi API kadaluarsa atau tidak valid. Silakan coba kembali sesaat lagi.");
        } else if (err.message?.includes("PERMISSION_DENIED")) {
            setGlobalError("Izin Video AI memerlukan otorisasi kuota video dari Google AI Studio.");
        } else {
            setGlobalError("Gagal merender video dari gambar ini. Pastikan kuota harian video Anda mencukupi.");
        }
    } finally {
        setVideoLoadings(prev => ({ ...prev, [index]: false }));
        setCooldown(45);
    }
  };

  const handleDownloadAll = async () => {
    if (generatedImages.length === 0) return;
    playClick();
    const zip = new JSZip();
    const rootFolder = zip.folder(`${productName.replace(/\s+/g, '_') || 'campaign'}_assets`);
    
    for (let i = 0; i < generatedImages.length; i++) {
        const scene = generatedImages[i];
        if (!scene) continue;

        const sceneFolderName = `Scene_${i + 1}`;
        const sceneFolder = rootFolder?.folder(sceneFolderName);
        
        // Image
        if (scene.src) {
            const imgData = await processImageForDownload(scene.src, config.ratio);
            const base64Data = imgData.split(',')[1];
            sceneFolder?.file(`image.png`, base64Data, { base64: true });
        }

        // Video
        if (scene.videoUrl) {
            const response = await fetch(scene.videoUrl);
            const blob = await response.blob();
            sceneFolder?.file(`video.mp4`, blob);
        }

        // Prompt Text
        let contextLogic = "";
        if (scene.voActive) {
            contextLogic = scene.isBRoll ? `NARRATIVE VOICE-OVER: '${scene.voText}'.` : `LIP-SYNC: Model is speaking: '${scene.voText}'.`;
        } else {
            contextLogic = scene.isBRoll ? "AMBIENT: No human visible." : "AMBIENT: No talking.";
        }
        const promptText = `SCENE ${i+1} PROMPT\n\nPROMPT: ${scene.videoMotion}\nCAMERA: ${scene.videoCamera}\nCONTEXT: ${contextLogic}\nENVIRONMENT: ${scene.activeBackground}\n\nGenerated via MOTION AI`;
        sceneFolder?.file(`prompt.txt`, promptText);
    }
    
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${productName.replace(/\s+/g, '_') || 'campaign'}_all_assets.zip`;
    a.click();
  };

  const handleCopyAllPrompts = () => {
    playClick();
    const allPrompts = generatedImages.map((scene, i) => {
        let contextLogic = "";
        if (scene.voActive) {
            contextLogic = scene.isBRoll ? `NARRATIVE VOICE-OVER: '${scene.voText}'.` : `LIP-SYNC: Model is speaking: '${scene.voText}'.`;
        } else {
            contextLogic = scene.isBRoll ? "AMBIENT: No human visible." : "AMBIENT: No talking.";
        }
        return `SCENE ${i+1}:\nPROMPT: ${scene.videoMotion}\nCAMERA: ${scene.videoCamera}\nCONTEXT: ${contextLogic}\nENVIRONMENT: ${scene.activeBackground}\n`;
    }).join("\n---\n\n");
    
    safeCopyToClipboard(allPrompts);
    alert("Semua prompt scene berhasil disalin ke clipboard!");
  };

  const renderContent = () => {
    switch (view) {
      case 'welcome':
        return (
          <LayoutWrapper>
            <div className="flex-grow flex flex-col items-center justify-center relative w-full h-full min-h-screen px-4 py-16 overflow-hidden">
              <AnimatePresence>
                <motion.div 
                  key="landing"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center gap-10 w-full max-w-4xl text-center"
                >
                  {/* Top Status Capsule */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/80 border border-sky-400/25 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]"
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_#38bdf8]" />
                    <span className="text-[11px] font-semibold tracking-widest text-sky-200 uppercase">
                      MOTION Studio Engine · Active
                    </span>
                  </motion.div>

                  {/* Brand Hero Title */}
                  <div className="space-y-4 max-w-3xl">
                    <motion.h1 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                      className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tight text-white uppercase leading-none drop-shadow-[0_15px_40px_rgba(0,122,255,0.3)]"
                    >
                      MOTION <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-blue-400 to-sky-300">AI</span>
                    </motion.h1>

                    <motion.p 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.25 }}
                      className="text-slate-300 text-base sm:text-lg md:text-xl font-normal leading-relaxed max-w-2xl mx-auto"
                    >
                      Studio visual & kampanye produk bertenaga AI kelas premium. Ubah foto produk Anda menjadi kampanye visual komersial, UGC, dan video bernilai tinggi secara konsisten.
                    </motion.p>
                  </div>

                  {/* Primary Call to Action */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    className="flex flex-col items-center gap-4 pt-2"
                  >
                    <motion.button
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { playClick(); setView('mode-selection'); }}
                      className="px-8 sm:px-10 py-4 sm:py-5 rounded-full bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white font-bold text-sm sm:text-base tracking-wider uppercase flex items-center gap-3 border-t border-white/40 shadow-[0_15px_45px_-5px_rgba(37,99,235,0.7),inset_0_1px_1px_rgba(255,255,255,0.5)] hover:from-blue-400 hover:to-blue-600 hover:shadow-[0_20px_50px_-5px_rgba(37,99,235,0.85)] transition-all group"
                    >
                      <span>Buka MOTION Studio</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                    <span className="text-xs text-slate-500 tracking-wider">
                      Modern · Cepat · 100% Konsistensi Visual
                    </span>
                  </motion.div>

                  {/* 3 Apple Glass Value Cards */}
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.55 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-4 text-left"
                  >
                    <div className="apple-glass-card rounded-2xl p-5 space-y-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-sky-400">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Konsistensi Presisi</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Mengunci identitas model dan skala proporsi produk di seluruh scene tanpa distorsi.
                      </p>
                    </div>

                    <div className="apple-glass-card rounded-2xl p-5 space-y-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-sky-400">
                        <Layers className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Multi-Scene Storyboard</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Otomatisasi skenario naskah, sudut pandang kamera, dan variasi framing sosial media.
                      </p>
                    </div>

                    <div className="apple-glass-card rounded-2xl p-5 space-y-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-sky-400">
                        <Film className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-white">Video & Voice Studio</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Siap diekspor ke audio TTS, naskah prompt video cinematic, hingga ZIP berkas kampanye.
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>
          </LayoutWrapper>
        );

      case 'mode-selection':
        return (
          <LayoutWrapper>
            <Navbar onBack={() => { setView('welcome'); }} cooldown={cooldown} />
            <DraggableBackButton onClick={() => { setView('welcome'); }} />
            <div className="flex-grow flex flex-col px-4 pt-6 pb-16 md:px-12 md:pt-10 lg:px-24">
              <div className="max-w-7xl mx-auto w-full space-y-10">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    <span className="text-[11px] font-bold tracking-widest text-sky-300 uppercase">
                      MOTION AI WORKSPACE
                    </span>
                  </div>
                  <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white">
                    Pilih Format Kampanye
                  </h2>
                  <p className="text-slate-400 text-sm md:text-lg max-w-2xl font-normal leading-relaxed">
                    Pilih gaya visual yang dirancang khusus untuk meningkatkan engagement dan daya tarik produk Anda.
                  </p>
                </motion.div>

                {/* Biru Glossy (Glass Apple) Bento Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {MODES.map((mode, i) => {
                    const cardStyles = [
                      'bento-card-azure',
                      'bento-card-cobalt',
                      'bento-card-electric',
                      'bento-card-ice',
                      'bento-card-deepsky',
                      'bento-card-cyanmarine'
                    ];
                    const cardClass = cardStyles[i % cardStyles.length];
                    const Icon = mode.icon;
                    
                    return (
                      <motion.button 
                        key={mode.id}
                        whileHover={{ scale: 0.99, y: -3 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { 
                          playClick();
                          setSelectedMode(mode); 
                          setDynamicBackgrounds((MODE_BACKGROUNDS as any)[mode.id]); 
                          setConfig(prev => ({...prev, background: (MODE_BACKGROUNDS as any)[mode.id][0]})); 
                          setView('upload-setup'); 
                        }}
                        className={`bento-card ${cardClass} w-full text-left min-h-[190px] flex flex-col justify-between p-7 group cursor-pointer`}
                      >
                        <div className="flex items-center justify-between">
                           <div className="w-11 h-11 rounded-2xl border border-white/20 flex items-center justify-center bg-white/10 backdrop-blur-md shadow-[0_4px_15px_rgba(0,0,0,0.2)] group-hover:border-white/40 group-hover:bg-white/20 transition-all">
                             <Icon className="w-5 h-5 text-sky-200 group-hover:text-white transition-colors" />
                           </div>
                           <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5 group-hover:bg-white/15 transition-all">
                             <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                           </div>
                        </div>
                        <div className="space-y-1.5 pt-4">
                          <h3 className="text-xl sm:text-2xl font-bold leading-tight text-white tracking-tight">
                            {mode.title}
                          </h3>
                          <p className="text-xs font-normal text-slate-300/80 leading-relaxed">
                            {mode.desc}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </LayoutWrapper>
        );

      case 'upload-setup':
        const isUploadComplete = (
          (selectedMode?.id === 'model' ? !!modelImage : (selectedMode?.id === 'pov' || (selectedMode?.id === 'food') ? true : !!modelImage)) && 
          (selectedMode?.id === 'model' ? true : (selectedMode?.id === 'vlog' ? (!!modelImage || !!productImage) : !!productImage))
        );
        return (
          <LayoutWrapper>
            <Navbar onBack={() => setView('mode-selection')} onViewResult={generatedImages.length > 0 ? () => setView('result') : null} cooldown={cooldown} />
            <DraggableBackButton onClick={() => setView('mode-selection')} />
            
            {/* System Notification Banner */}
            {globalError && (
              <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4 animate-in fade-in slide-in-from-top-4">
                <div className="bg-rose-950/80 border border-rose-500/40 backdrop-blur-2xl p-4 rounded-2xl flex items-start gap-3.5 shadow-2xl">
                  <div className="bg-rose-500 rounded-full p-1.5 mt-0.5 shrink-0"><X className="w-3.5 h-3.5 text-white" /></div>
                  <div className="flex-grow">
                    <p className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-0.5">Pemberitahuan Sistem</p>
                    <p className="text-xs text-slate-200 leading-relaxed">{globalError}</p>
                  </div>
                  <button onClick={() => setGlobalError(null)} className="text-slate-400 hover:text-white transition-colors p-1"><X className="w-4 h-4" /></button>
                </div>
              </div>
            )}

            <div className="flex-grow flex flex-col px-4 pt-4 pb-16 md:px-12 md:pt-8 lg:px-24">
               <div className="max-w-6xl mx-auto w-full flex flex-col gap-10">
                  {/* Step Header */}
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                        <span className="text-[11px] font-bold tracking-widest text-sky-300 uppercase">
                          LANGKAH 01 · {selectedMode?.title}
                        </span>
                      </div>
                      <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                        Setup <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">Aset Visual</span>
                      </h2>
                      <p className="text-xs md:text-sm text-slate-400 font-normal">
                        Unggah referensi foto produk dan tentukan karakter visual untuk kampanye Anda.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-white/10 backdrop-blur-md">
                        <span className="text-xs font-medium text-slate-400">Progres:</span>
                        <span className={`text-xs font-bold ${isUploadComplete && isProductConfirmed ? 'text-sky-400' : 'text-slate-300'}`}>
                          {isUploadComplete && isProductConfirmed ? 'Terverifikasi (2/2)' : isUploadComplete ? 'Menunggu Verifikasi (1/2)' : 'Siapkan Berkas (0/2)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-8 lg:grid-cols-12">
                    {/* Left Column: Upload Zones */}
                    <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-6">
                        {(selectedMode?.id !== 'pov' && selectedMode?.id !== 'food' && selectedMode?.id !== 'model') && (
                          <UploadZone 
                            label="Referensi Model Wajah" 
                            image={modelImage} 
                            onClick={() => modelInputRef.current?.click()} 
                            onClear={() => setModelImage(null)}
                            icon={Camera} 
                          />
                        )}
                        {selectedMode?.id === 'model' && (
                          <UploadZone 
                            label="Identitas Karakter Base" 
                            image={modelImage} 
                            onClick={() => modelInputRef.current?.click()} 
                            onClear={() => setModelImage(null)}
                            icon={UserCheck} 
                          />
                        )}
                        {selectedMode?.id === 'food' && (
                          <UploadZone 
                            label="Model Lifestyle (Opsional)" 
                            image={modelImage} 
                            onClick={() => modelInputRef.current?.click()} 
                            onClear={() => setModelImage(null)}
                            icon={UserCheck} 
                          />
                        )}
                        {selectedMode?.id !== 'model' && (
                          <UploadZone 
                              label={selectedMode?.id === 'food' ? "Foto Makanan / Kuliner" : "Foto Produk Utama"} 
                              image={productImage} 
                              onClick={() => productInputRef.current?.click()} 
                              onClear={() => setProductImage(null)}
                              icon={Package} 
                          />
                        )}
                      </div>
                    </div>

                    {/* Right Column: Parameters and Customization */}
                    <div className="lg:col-span-12 xl:col-span-7">
                       <div className="apple-glass-card rounded-[2.5rem] p-6 md:p-10 space-y-8 shadow-2xl relative overflow-hidden h-full flex flex-col">
                            {/* Blue ambient glow inside card */}
                            <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-blue-600/20 via-sky-400/10 to-transparent rounded-full blur-[100px] pointer-events-none" />
                            
                            <div className="space-y-6 flex-grow relative z-10">
                               {selectedMode?.id === 'model' ? (
                                   <div className="space-y-6">
                                       <div className="flex flex-col gap-1">
                                           <h3 className="text-base font-bold text-white tracking-tight">Kustomisasi Karakter Model</h3>
                                           <p className="text-xs text-slate-400">Tentukan atribut visual model untuk menjaga konsistensi identitas.</p>
                                       </div>

                                       <div className="grid grid-cols-2 gap-4">
                                           <div className="space-y-2">
                                               <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Mode Identitas</label>
                                               <select 
                                                 value={charIdentity} 
                                                 onChange={(e) => setCharIdentity(e.target.value)}
                                                 className="w-full bg-slate-950/70 border border-white/10 text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30"
                                               >
                                                   <option value="exact">100% Klon Identik</option>
                                                   <option value="inspired">Karakter Terinspirasi (Baru)</option>
                                               </select>
                                           </div>
                                           <div className="space-y-2">
                                               <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Gender</label>
                                               <select 
                                                 value={charGender} 
                                                 onChange={(e) => setCharGender(e.target.value)}
                                                 className="w-full bg-slate-950/70 border border-white/10 text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30"
                                               >
                                                   <option value="Female">Female</option>
                                                   <option value="Male">Male</option>
                                                   <option value="Non-binary">Non-binary</option>
                                                   <option value="Androgynous">Androgynous</option>
                                                   <option value="Genderfluid">Genderfluid</option>
                                               </select>
                                           </div>
                                       </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                           <div className="space-y-2">
                                               <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Gaya & Warna Rambut</label>
                                               <select 
                                                 value={charHair} 
                                                 onChange={(e) => setCharHair(e.target.value)}
                                                 className="w-full bg-slate-950/70 border border-white/10 text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30"
                                               >
                                                   {CHAR_HAIR_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                               </select>
                                           </div>
                                           <div className="space-y-2">
                                               <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Pakaian / Busana</label>
                                               <select 
                                                 value={charOutfit} 
                                                 onChange={(e) => setCharOutfit(e.target.value)}
                                                 className="w-full bg-slate-950/70 border border-white/10 text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30"
                                               >
                                                   {CHAR_OUTFIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                               </select>
                                           </div>
                                       </div>

                                       <div className="grid grid-cols-2 gap-4">
                                           <div className="space-y-2">
                                               <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Rentang Usia</label>
                                               <select 
                                                 value={charAge} 
                                                 onChange={(e) => setCharAge(e.target.value)}
                                                 className="w-full bg-slate-950/70 border border-white/10 text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30"
                                               >
                                                   {CHAR_AGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                               </select>
                                           </div>
                                           <div className="space-y-2">
                                               <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Etnis / Wajah</label>
                                               <select 
                                                 value={charEthnicity} 
                                                 onChange={(e) => setCharEthnicity(e.target.value)}
                                                 className="w-full bg-slate-950/70 border border-white/10 text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30"
                                               >
                                                   {CHAR_ETHNICITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                               </select>
                                           </div>
                                       </div>

                                        <div className="grid grid-cols-2 gap-4">
                                           <div className="space-y-2">
                                               <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Tipe Tubuh</label>
                                               <select 
                                                 value={charBody} 
                                                 onChange={(e) => setCharBody(e.target.value)}
                                                 className="w-full bg-slate-950/70 border border-white/10 text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30"
                                               >
                                                   {CHAR_BODY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                               </select>
                                           </div>
                                           <div className="space-y-2">
                                               <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Warna Mata</label>
                                               <select 
                                                 value={charEyes} 
                                                 onChange={(e) => setCharEyes(e.target.value)}
                                                 className="w-full bg-slate-950/70 border border-white/10 text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30"
                                               >
                                                   {CHAR_EYE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                               </select>
                                           </div>
                                       </div>

                                       <div className="grid grid-cols-2 gap-4">
                                           <div className="space-y-2">
                                               <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Ekspresi Wajah</label>
                                               <select 
                                                 value={charExpression} 
                                                 onChange={(e) => setCharExpression(e.target.value)}
                                                 className="w-full bg-slate-950/70 border border-white/10 text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30"
                                               >
                                                   {CHAR_EXPRESSION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                               </select>
                                           </div>
                                           <div className="space-y-2">
                                               <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Detail Khusus</label>
                                               <select 
                                                 value={charFaceDetails} 
                                                 onChange={(e) => setCharFaceDetails(e.target.value)}
                                                 className="w-full bg-slate-950/70 border border-white/10 text-slate-100 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30"
                                               >
                                                   {CHAR_FACE_DETAIL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                               </select>
                                           </div>
                                       </div>
                                   </div>
                               ) : (
                                   <>
                                       <div className="space-y-3">
                                           <div className="flex items-center gap-2 px-1">
                                             <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                             <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Nama Produk</label>
                                           </div>
                                           <div className="relative">
                                               {isAnalyzingProduct && (
                                                 <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md rounded-2xl z-20 flex items-center justify-center gap-2 border border-sky-400/30">
                                                   <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
                                                   <span className="text-xs text-sky-300 font-medium">Menganalisis produk...</span>
                                                 </div>
                                               )}
                                               <input 
                                                 type="text" 
                                                 value={productName} 
                                                 onChange={(e) => setProductName(e.target.value)} 
                                                 placeholder={isAnalyzingProduct ? "" : (selectedMode?.id === 'food' ? "Contoh: Wagyu A5 Steak Grill" : "Masukkan merek & nama produk...")} 
                                                 className="w-full bg-slate-950/70 border border-white/10 text-white rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all placeholder:text-slate-600" 
                                               />
                                           </div>
                                       </div>

                                       <div className="space-y-3">
                                           <div className="flex items-center gap-2 px-1">
                                             <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                             <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Deskripsi & Keunggulan Produk</label>
                                           </div>
                                           <div className="relative">
                                               {isAnalyzingProduct && (
                                                 <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md rounded-2xl z-20 flex items-center justify-center border border-sky-400/20" />
                                               )}
                                               <textarea 
                                                 value={productDesc} 
                                                 onChange={(e) => setProductDesc(e.target.value)} 
                                                 placeholder={isAnalyzingProduct ? "" : (selectedMode?.id === 'food' ? "Jelaskan bahan, plating, aroma, atau suasana santap..." : "Jelaskan fitur utama, manfaat, warna/ciri unik...")} 
                                                 className="w-full h-36 bg-slate-950/70 border border-white/10 text-white rounded-2xl p-4 text-sm font-medium focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 transition-all resize-none placeholder:text-slate-600" 
                                               />
                                           </div>
                                       </div>
                                   </>
                               )}
                            </div>

                            <div className="space-y-5 pt-6 border-t border-white/10 relative z-10">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-white tracking-wide">Integritas Data</span>
                                        <span className="text-[10px] text-slate-400 mt-0.5">Konfirmasi kesesuaian informasi sebelum masuk studio</span>
                                    </div>
                                    <div className="flex justify-end">
                                      {(isProductConfirmed || (!isAnalyzingProduct && (selectedMode?.id === 'model' || (productImage && productName)))) && (
                                        <motion.button 
                                          whileHover={{ scale: 1.03 }}
                                          whileTap={{ scale: 0.97 }}
                                          onClick={() => { playClick(); setIsProductConfirmed(!isProductConfirmed); }} 
                                          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                                            isProductConfirmed 
                                              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_4px_20px_rgba(14,165,233,0.4)] border border-sky-300/40' 
                                              : 'bg-slate-800 text-slate-200 border border-white/15 hover:border-sky-400/40 hover:text-white'
                                          }`}
                                        >
                                          {isProductConfirmed ? <><CheckCircle2 className="w-4 h-4 text-white"/> Terverifikasi</> : "Verifikasi Data"}
                                        </motion.button>
                                      )}
                                    </div>
                                </div>
                                
                                <ButtonCTA disabled={!isUploadComplete || !isProductConfirmed} onClick={() => setView('config')}>
                                  Lanjut ke Studio Visual
                                </ButtonCTA>
                            </div>
                       </div>
                    </div>
                  </div>

                  <input type="file" ref={modelInputRef} onChange={handleModelUpload} className="hidden" />
                  <input type="file" ref={guestModelInputRef} onChange={handleGuestModelUpload} className="hidden" />
                  <input type="file" ref={productInputRef} onChange={handleProductUpload} className="hidden" />
               </div>
            </div>
          </LayoutWrapper>
        );

      case 'config':
        return (
          <LayoutWrapper>
            <Navbar onBack={() => setView('upload-setup')} onViewResult={generatedImages.length > 0 ? () => setView('result') : null} cooldown={cooldown} />
            <DraggableBackButton onClick={() => setView('upload-setup')} />
            <div className="flex-grow flex flex-col px-4 pt-6 pb-16 md:px-12 md:pt-10 lg:px-24 relative overflow-hidden">
              <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10">
                <div className="lg:col-span-7 space-y-8">
                  <motion.div 
                    initial={{ opacity: 0, y: -15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <SectionTitle 
                      title="Konfigurasi Studio" 
                      subtitle="Sesuaikan latar belakang, rasio aspek, dan volume scene untuk hasil visual terbaik." 
                    />
                  </motion.div>
                  
                  <div className="space-y-6">
                    {/* Background Environment Card */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="apple-glass-card p-6 md:p-8 rounded-[2rem] space-y-6"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center border border-blue-400/30 text-sky-400">
                          <Layout className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col text-left">
                          <label className="text-xs font-bold uppercase tracking-wider text-white">Latar Belakang Studio</label>
                          <span className="text-[11px] text-slate-400 font-normal">Pilih suasana lingkungan visual kampanye</span>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <select 
                          value={bgType === 'custom' ? 'CUSTOM' : config.background} 
                          onChange={(e) => { 
                            playClick(); 
                            if (e.target.value === 'CUSTOM') {
                              setBgType('custom'); 
                            } else { 
                              setBgType('preset'); 
                              setConfig({...config, background: e.target.value}); 
                            } 
                          }} 
                          className="w-full bg-slate-950/70 border border-blue-500/25 text-white rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 appearance-none cursor-pointer backdrop-blur-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]"
                        >
                          {dynamicBackgrounds.map(bg => (
                            <option key={bg} value={bg} className="bg-slate-950 text-white">{bg}</option>
                          ))}
                          <option value="CUSTOM" className="bg-slate-950 text-sky-300">✨ Tulis Latar Kustom Sendiri...</option>
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <ChevronDown className="w-5 h-5" />
                        </div>
                      </div>

                      {bgType === 'custom' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="pt-2"
                        >
                          <input 
                            type="text" 
                            placeholder="Deskripsikan suasana studio kustom (cth: Penthouse minimalis dengan city view malam)..." 
                            value={customBg} 
                            onChange={(e) => setCustomBg(e.target.value)} 
                            className="w-full bg-slate-950/70 border border-sky-400/30 text-white rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/25 transition-all placeholder:text-slate-600" 
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                </div>

                {/* Right Column: Output Config */}
                <div className="lg:col-span-5 space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="apple-glass-card p-6 md:p-8 rounded-[2.5rem] space-y-8 shadow-2xl relative overflow-hidden"
                  >
                    {/* Inner highlight glow */}
                    <div className="absolute top-0 right-0 w-60 h-60 bg-blue-600/15 rounded-full blur-[80px] pointer-events-none" />
                    
                    <div className="space-y-8 relative z-10">
                      {/* Aspect Ratio Selection */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Rasio Frame</label>
                          <span className="text-[10px] font-bold text-sky-300 bg-sky-500/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-sky-400/30">
                            {config.ratio}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {RATIOS.map(r => (
                            <button 
                              key={r.value} 
                              onClick={() => { playClick(); setConfig({...config, ratio: r.value}); }} 
                              className={`group relative flex flex-col items-center gap-3 py-5 rounded-2xl border transition-all duration-300 ${
                                config.ratio === r.value 
                                  ? 'bg-gradient-to-b from-blue-500 to-blue-700 text-white border-white/30 shadow-[0_8px_25px_rgba(37,99,235,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)]' 
                                  : 'bg-white/[0.04] text-slate-400 border-white/10 hover:border-sky-400/30 hover:text-white backdrop-blur-md'
                              }`}
                            >
                              <div className={`border-2 rounded-sm transition-all duration-300 ${
                                config.ratio === r.value ? 'border-white' : 'border-slate-600 group-hover:border-slate-400'
                              } ${r.value === '9:16' ? 'w-3.5 h-7' : r.value === '16:9' ? 'w-8 h-5' : 'w-6 h-6'}`} />
                              <span className="text-[10px] font-bold uppercase tracking-wider">{r.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Scene Counts Selection */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Volume Scene</label>
                          <span className="text-[10px] font-bold text-sky-300 bg-sky-500/15 px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-sky-400/30">
                            {config.scenes} Adegan
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {SCENE_COUNTS.map(count => (
                            <button 
                              key={count} 
                              onClick={() => { playClick(); setConfig({...config, scenes: count}); }} 
                              className={`py-4 rounded-2xl text-xs font-bold uppercase tracking-wider border transition-all duration-300 ${
                                config.scenes === count 
                                  ? 'bg-gradient-to-b from-blue-500 to-blue-700 text-white border-white/30 shadow-[0_8px_25px_rgba(37,99,235,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)]' 
                                  : 'bg-white/[0.04] text-slate-400 border-white/10 hover:border-sky-400/30 hover:text-white backdrop-blur-md'
                              }`}
                            >
                              {count} Scene
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 space-y-4 relative z-10">
                      <motion.button 
                        whileHover={cooldown > 0 ? {} : { scale: 1.02, y: -2 }}
                        whileTap={cooldown > 0 ? {} : { scale: 0.98 }}
                        onClick={cooldown > 0 ? undefined : generateVisual}
                        disabled={cooldown > 0}
                        className={`w-full py-5 rounded-2xl font-bold text-xs tracking-widest uppercase transition-all duration-300 ${
                          cooldown > 0 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' 
                            : 'bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white border-t border-white/35 shadow-[0_15px_40px_-5px_rgba(37,99,235,0.7),inset_0_1px_1px_rgba(255,255,255,0.45)] hover:from-blue-400 hover:to-blue-600'
                        }`}
                      >
                        {cooldown > 0 ? `Menunggu Cooldown ${cooldown}s` : 'Generate Visual Kampanye'}
                      </motion.button>
                      <div className="flex items-center justify-center gap-2 text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                        <p className="text-[10px] font-semibold tracking-wider uppercase">Estimasi Waktu: ~60 detik</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </LayoutWrapper>
        );

      case 'result':
        return (
          <LayoutWrapper className="h-screen flex flex-col overflow-hidden bg-[#030712]">
            <DraggableBackButton onClick={() => setView('config')} />
            
            {globalError && (
              <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4 animate-in fade-in slide-in-from-top-4">
                <div className="bg-rose-950/80 border border-rose-500/40 backdrop-blur-2xl p-4 rounded-2xl flex items-start gap-3.5 shadow-2xl">
                  <div className="bg-rose-500 rounded-full p-1.5 mt-0.5 shrink-0"><X className="w-3.5 h-3.5 text-white" /></div>
                  <div className="flex-grow">
                    <p className="text-xs font-bold text-rose-300 uppercase tracking-wider mb-0.5">Pemberitahuan Sistem</p>
                    <p className="text-xs text-slate-200 leading-relaxed">{globalError}</p>
                  </div>
                  <button onClick={() => setGlobalError(null)} className="text-slate-400 hover:text-white transition-colors p-1"><X className="w-4 h-4" /></button>
                </div>
              </div>
            )}

            {/* Apple Glass Result Topbar */}
            <div className="h-20 border-b border-white/10 flex items-center justify-between px-4 md:px-12 bg-slate-950/70 backdrop-blur-2xl z-30 shrink-0">
              <div className="flex items-center gap-6 min-w-0">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shadow-[0_0_8px_#38bdf8]" />
                    <span className="text-[10px] text-sky-300 font-bold uppercase tracking-widest">MOTION AI STUDIO</span>
                  </div>
                  <h1 className="text-base md:text-xl font-bold text-white tracking-tight truncate max-w-[320px] md:max-w-[450px]">
                    {productName || 'Proyek Visual'}
                  </h1>
                </div>
                
                <div className="hidden lg:flex items-center gap-6 pl-6 border-l border-white/10">
                   <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Latar Studio</span>
                      <span className="text-xs text-slate-200 font-medium truncate max-w-[160px]">
                        {bgType === 'custom' ? (customBg || 'Kustom') : config.background}
                      </span>
                   </div>
                   <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Rasio Frame</span>
                      <span className="text-xs text-sky-400 font-bold">{config.ratio}</span>
                   </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {cooldown > 0 && <CooldownBadge cooldown={cooldown} />}
                
                {!isGenerating && (
                   <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView('config')} 
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-white/15 text-xs font-semibold text-slate-300 hover:text-white hover:border-sky-400/40 transition-all backdrop-blur-md"
                   >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali ke Studio</span>
                   </motion.button>
                )}
              </div>
            </div>

            {/* Results Grid Scrollport */}
            <div className="flex-grow relative overflow-y-auto custom-scrollbar">
              <div className="max-w-[1720px] mx-auto p-4 md:p-8 pb-32">
                <div className={`grid gap-6 md:gap-8 ${
                  config.scenes <= 4 
                    ? 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto' 
                    : config.scenes === 6
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                }`}>
                  {Array.from({ length: config.scenes }).map((_, index) => {
                    const sceneData = generatedImages[index]; 
                    const image = sceneData?.src;
                    const isLoadingThis = sceneLoadings[index] || (isGenerating && !image);
                    
                    return (
                      <div key={index} className="flex flex-col gap-4 group">
                        {/* Image Container with Apple Glass Frame */}
                        <div className={`relative rounded-[2rem] overflow-hidden bg-slate-900 border border-white/10 shadow-2xl transition-all duration-500 ${
                          config.ratio === '9:16' ? 'aspect-[9/16]' : config.ratio === '16:9' ? 'aspect-video' : 'aspect-square'
                        } ${image ? 'hover:border-sky-400/40 hover:shadow-[0_15px_40px_rgba(14,165,233,0.2)]' : ''}`}>
                          {image ? (
                            <>
                               <img 
                                 src={image} 
                                 alt={`Scene ${index + 1}`} 
                                 className={`w-full h-full object-cover ${config.ratio === '16:9' ? 'object-center' : 'object-top'} transition-all duration-700 ${
                                   isLoadingThis ? 'scale-105 blur-lg opacity-40' : 'group-hover:scale-105'
                                 }`} 
                                 referrerPolicy="no-referrer" 
                               />
                              
                              {isLoadingThis ? (
                                 <GeneratingState index={index} />
                              ) : (
                                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-3 z-20 backdrop-blur-sm">
                                      <motion.button 
                                        initial={{ scale: 0.85, opacity: 0 }}
                                        whileHover={{ scale: 1.1 }}
                                        whileInView={{ scale: 1, opacity: 1 }}
                                        onClick={() => setPreviewImage(image)} 
                                        className="w-14 h-14 bg-gradient-to-b from-blue-500 to-blue-700 text-white rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(37,99,235,0.6)] border border-white/30 transition-all"
                                      >
                                        <ZoomIn className="w-6 h-6" />
                                      </motion.button>
                                      <span className="text-[11px] font-bold tracking-wider text-slate-200">Perbesar Tampilan</span>
                                  </div>
                              )}
                            </>
                          ) : (
                            <div className="absolute inset-0">
                               <GeneratingState index={index} />
                            </div>
                          )}
                          
                          {/* Label Scene Badge */}
                          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/15 z-10 shadow-lg">
                            <span className="text-[10px] font-bold text-sky-300 font-mono tracking-wider">SCENE 0{index + 1}</span>
                          </div>
                        </div>

                        {/* Controls Panel under Image */}
                        {image && !isGenerating && (
                          <div className="apple-glass-card rounded-2xl p-4 space-y-4 shadow-xl relative z-10">
                             <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                                  Scene 0{index + 1}
                                </span>
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => processImageForDownload(image, config.ratio).then(url => { 
                                      const a = document.createElement('a'); 
                                      a.href = url; 
                                      a.download = `motion-ai-scene-${index+1}.png`; 
                                      a.click(); 
                                    })} 
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-b from-blue-500 to-blue-700 text-white rounded-lg text-xs font-semibold hover:from-blue-400 hover:to-blue-600 transition-all shadow-[0_4px_12px_rgba(37,99,235,0.3)] border-t border-white/30"
                                  >
                                    <Download className="w-3.5 h-3.5" /> Unduh Foto
                                  </button>
                                </div>
                             </div>

                             <div className="space-y-3 pt-1">
                                 {/* AI Revision Input */}
                                 <div className="bg-slate-950/60 border border-sky-400/25 rounded-xl p-3 space-y-2 relative shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
                                    <div className="flex items-center gap-1.5">
                                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                                      <span className="text-[11px] font-bold tracking-wider text-sky-300 uppercase">Revisi Visual AI</span>
                                    </div>
                                    <div className="relative flex gap-2">
                                      <input 
                                        type="text" 
                                        disabled={isLoadingThis} 
                                        placeholder="Cth: Pencahayaan lebih terang, ubah pose, senyum..." 
                                        className="flex-grow bg-slate-900/80 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-all disabled:opacity-50" 
                                        value={scenePrompts[index] || ""} 
                                        onChange={(e) => setScenePrompts(prev => ({...prev, [index]: e.target.value}))} 
                                        onKeyDown={(e) => e.key === 'Enter' && regenerateSingleScene(index)} 
                                      />
                                      <button 
                                        type="button" 
                                        onClick={() => regenerateSingleScene(index)} 
                                        disabled={isLoadingThis || !scenePrompts[index] || cooldown > 0} 
                                        className="px-3.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-200 border border-white/15 hover:bg-sky-500 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                                      >
                                        {isLoadingThis ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (cooldown > 0 ? `${cooldown}s` : "Kirim")}
                                      </button>
                                    </div>
                                 </div>

                                 {/* Voice-Over Script */}
                                 <div className="bg-slate-950/60 p-3 rounded-xl border border-white/10 space-y-2">
                                     <div className="flex items-center justify-between">
                                         <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${sceneData.voActive ? 'text-sky-400' : 'text-slate-500'}`}>
                                             <Mic className="w-3 h-3"/> Voice Over {sceneData.voActive ? 'Aktif' : 'Nonaktif'}
                                         </span>
                                         <label className="relative inline-flex items-center cursor-pointer">
                                           <input 
                                               type="checkbox" 
                                               className="sr-only peer" 
                                               checked={sceneData.voActive || false} 
                                               onChange={(e) => updateSceneData(index, { voActive: e.target.checked })} 
                                               disabled={isLoadingThis} 
                                           />
                                           <div className="w-8 h-4.5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
                                         </label>
                                     </div>
                                     
                                     {sceneData.voActive ? (
                                         <div className="space-y-2">
                                             <textarea 
                                                 value={sceneData.voText || ""} 
                                                 onChange={(e) => updateSceneData(index, { voText: e.target.value })}
                                                 disabled={isLoadingThis}
                                                 className="w-full bg-slate-900/80 border border-white/10 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400 transition-all resize-none h-16 custom-scrollbar"
                                                 placeholder="Tulis naskah narasi voice over di sini..."
                                             />
                                             <button 
                                                 onClick={() => regenerateSingleScene(index, sceneData.voText)}
                                                 disabled={isLoadingThis}
                                                 className="w-full py-1.5 bg-blue-600/20 text-sky-300 border border-blue-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
                                             >
                                                 {isLoadingThis ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : (cooldown > 0 ? `Menunggu ${cooldown}s` : "Perbarui Naskah")}
                                             </button>
                                         </div>
                                     ) : (
                                         <div className="flex items-center justify-center py-2 bg-slate-900/40 rounded-lg border border-white/5 border-dashed">
                                             <p className="text-[10px] text-slate-500 italic">Hanya musik latar / visual murni</p>
                                         </div>
                                     )}
                                 </div>
                             </div>

                             <div className="flex gap-2">
                                 <button 
                                     type="button" 
                                     onClick={() => handleCopyPrompt(index)} 
                                     className={`flex-grow py-2.5 border text-xs font-semibold tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 ${
                                       copiedStates[index] 
                                         ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                                         : 'bg-slate-900 border-white/10 text-slate-300 hover:text-white hover:border-sky-400/30'
                                     }`}
                                 >
                                     {copiedStates[index] ? (
                                         <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Prompt Disalin</>
                                     ) : (
                                         <><Copy className="w-3.5 h-3.5" /> Salin Prompt Video</>
                                     )}
                                 </button>
                             </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!isGenerating && (
                  <div className="mt-16 flex flex-col items-center gap-8">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <motion.button 
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleDownloadAll} 
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 text-white rounded-full text-xs font-bold tracking-wider uppercase border-t border-white/40 shadow-[0_12px_30px_rgba(37,99,235,0.6)] hover:from-blue-400 hover:to-blue-600 transition-all min-w-[240px]"
                      >
                        <Download className="w-4 h-4" /> 
                        Simpan Semua Aset (ZIP)
                      </motion.button>

                      <motion.button 
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowVideoGenerators(!showVideoGenerators)} 
                        className={`flex items-center justify-center gap-3 px-8 py-4 border rounded-full text-xs font-bold tracking-wider uppercase transition-all min-w-[240px] ${
                          showVideoGenerators 
                            ? 'bg-white text-slate-950 border-white shadow-[0_8px_25px_rgba(255,255,255,0.3)]' 
                            : 'bg-slate-900 border-white/15 text-slate-200 hover:border-sky-400/40 hover:text-white backdrop-blur-md'
                        }`}
                      >
                        <Video className="w-4 h-4" /> 
                        Render Video AI
                      </motion.button>
                    </div>

                    {showVideoGenerators && (
                      <div className="apple-glass-card p-6 rounded-3xl flex flex-col items-center gap-5 w-full max-w-xl animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-3 w-full">
                           <div className="h-px flex-grow bg-white/10" />
                           <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                             Platform Generator Video Eksternal
                           </span>
                           <div className="h-px flex-grow bg-white/10" />
                        </div>
                        <div className="grid grid-cols-3 gap-3 w-full">
                          {[
                            { name: 'Meta AI', url: 'https://www.meta.ai/' },
                            { name: 'Grok AI', url: 'https://grok.com/' },
                            { name: 'Flow AI', url: 'https://labs.google/fx/tools/flow' }
                          ].map(ext => (
                            <a 
                              key={ext.name} 
                              href={ext.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex flex-col items-center justify-center p-3.5 bg-slate-950/70 border border-white/10 rounded-2xl hover:border-sky-400/40 hover:bg-slate-900 text-xs font-bold text-slate-300 hover:text-white transition-all text-center"
                            >
                              {ext.name}
                            </a>
                          ))}
                        </div>
                        
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleCopyAllPrompts}
                          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500/15 border border-sky-400/30 text-sky-300 rounded-xl text-xs font-semibold hover:bg-blue-500/25 transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" /> Salin Seluruh Prompt Video
                        </motion.button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Lightbox / Preview Modal */}
            {previewImage && (
              <div 
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-200" 
                onClick={() => setPreviewImage(null)}
              >
                <div 
                  className={`
                    relative overflow-hidden rounded-2xl shadow-2xl transition-all flex items-center justify-center bg-slate-950 border border-white/15
                    ${config.ratio === '9:16' ? 'aspect-[9/16] h-full max-h-[90vh] w-auto' : ''}
                    ${config.ratio === '16:9' ? 'aspect-[16/9] w-full max-w-[90vw] h-auto' : ''}
                    ${config.ratio === '1:1' ? 'aspect-square h-full max-h-[90vh] w-auto' : ''}
                  `}
                  onClick={(e) => e.stopPropagation()}
                >
                   <img 
                     src={previewImage} 
                     alt="Full Preview" 
                     className={`w-full h-full object-cover ${config.ratio === '16:9' ? 'object-center' : 'object-top'}`} 
                     referrerPolicy="no-referrer" 
                   />
                  <button 
                    type="button" 
                    onClick={() => setPreviewImage(null)} 
                    className="absolute top-4 right-4 p-2 bg-slate-950/70 hover:bg-slate-900 rounded-full text-white transition-colors backdrop-blur-md border border-white/20 z-20"
                    title="Tutup"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </LayoutWrapper>
        );

      default: return null;
    }
  };

  return (
    <>
      {renderContent()}
    </>
  );
}
