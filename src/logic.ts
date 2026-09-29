/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const REALISM_LAWS = "RAW IPHONE PHOTOGRAPHY: This image MUST be a 100% authentic, unedited handheld photo taken with an iPhone 15 Pro. Capture raw skin textures, visible pores, natural skin oils, and realistic imperfections. LIGHTING: NATURAL AND REALISTIC LIGHTING (indoor room light or natural daylight). NO DRAMATIC CINEMATIC EFFECTS. ABSOLUTELY NO AI SMOOTHNESS, NO BEAUTY FILTERS, NO CGI, NO SOFTBOXES, NO DIFFUSED LIGHTING. Include realistic lens artifacts and natural image grain. It must look like a genuine, unedited social media snapshot.";

export const IDENTITY_LOCK = "IDENTITY CLONE: The person in the generated image MUST be a 100% exact, pixel-perfect, identical clone of the person in REFERENCE IMAGE 1. MATCH GENDER, FACE SHAPE, HAIR STYLE, HAIR COLOR, AND BODY POSTURE EXACTLY. DO NOT change any facial features, eyes, nose, mouth, or face shape. The identity must be 100% consistent across all scenes. The model is the EXACT SAME PERSON from the reference. NO FACIAL RE-IMAGINING. NO BEAUTIFICATION. NO GENDER SWAPPING. NO EXCEPTIONS.";

export const PRODUCT_CONSISTENCY = "PRODUCT CLONE: The product(s) in the generated image MUST be a 100% exact replica of REFERENCE IMAGE 2. Identical color, texture, branding, shape, and SCALE. The product's size relative to the person and environment must be 100% realistic and consistent with its real-world dimensions. NO VARIATIONS. NO ALTERATIONS. NO SIZE DISTORTIONS.";

export const getModeLogic = (
    modeId: string | undefined, 
    index: number, 
    productName: string, 
    productDesc: string, 
    background: string, 
    ugcStyle = 'Handheld',
    charParams?: {
        identity: string,
        gender: string,
        hair: string,
        outfit: string,
        age: string,
        ethnicity: string,
        body?: string,
        eyes?: string,
        expression?: string,
        faceDetails?: string,
        hasModel?: boolean
    }
) => {
    let subjectPrompt = "";
    let negPrompt = "";
    let cameraLogic = "";
    let motionCamera = "";
    let modeEnforcement = "";
    let identityConstraint = IDENTITY_LOCK;
    let lipSyncLogic = "AMBIENT: Mouth closed or natural breathing, no talking.";

    if (charParams && charParams.identity === 'inspired') {
        identityConstraint = "INSPIRED CHARACTER: The person in the image must be a NEW, UNIQUE character who strongly resembles the person in REFERENCE IMAGE 1 in terms of features, vibe, and facial structure, but is clearly a distinct individual. Maintain overall aesthetic consistency.";
    }

    switch (modeId) {
        case 'vlog':
            modeEnforcement = "STYLE: Cinematic Personal Vlog. High-quality visual storytelling.";
            cameraLogic = "Professional handheld camera look, smooth but natural motion, cinematic framing.";
            const vlogAction = productName 
                ? `Model is interacting naturally with ${productName} (${productDesc}) in a vlog setting.` 
                : "Model is engaging in an aesthetic daily activity, cinematic lifestyle shot.";
            subjectPrompt = `${modeEnforcement} CINEMATIC VLOG SHOT in ${background} (${cameraLogic}). ${vlogAction} Final output should be highly aesthetic, expressive, and look like a still from a high-quality vlog. Background: ${background}.`;
            negPrompt = "Amateur look, security camera, blurry, distorted, grainy, low quality, floating objects, disconnected hands, text, overlay, captions, subtitles, UI elements, graphics.";
            lipSyncLogic = "LIP-SYNC: Model is speaking naturally as if talking to followers: '[SCRIPT_SCENE_TERSEBUT]'.";
            break;

        case 'food':
            modeEnforcement = "STYLE: Professional Food Photography. High-end culinary aesthetic.";
            cameraLogic = "Macro lens, shallow depth of field, focused on food textures and details.";
            
            if (charParams?.hasModel) {
                subjectPrompt = `${modeEnforcement} A professional model (Identity from Reference 1) is featured with the food product: ${productName} (${productDesc}) in ${background}. The model adds a luxury lifestyle vibe, perhaps holding a utensil or sitting gracefully. HOWEVER, the food itself must be the absolute hero of the shot - looking incredibly delicious, with high-end plating. Perfect lighting integration, steam or glistening textures on the food.`;
                negPrompt = "Dirty, unappetizing, plastic look, blurry, low resolution, messy background, distorted model human features.";
            } else {
                subjectPrompt = `${modeEnforcement} THE FOOD PRODUCT: ${productName} (${productDesc}) arranged beautifully in ${background}. High contrast, delicious look, steam or glistening textures. Studio lighting. Professional plating. ABSOLUTELY NO PEOPLE, NO FACES, NO HUMAN SKIN, NO ARMS, NO HANDS. 100% PURE FOOD PHOTOGRAPHY HERO SHOT.`;
                negPrompt = "People, faces, hands, skin, arms, humans, person, man, woman, child, messy platter, dirty, unappetizing, plastic look, blurry, low resolution, messy background.";
            }
            break;

        case 'model':
            modeEnforcement = "STYLE: Professional Character/Fashion Portrait. High-fidelity subject focus.";
            cameraLogic = "Clean studio lens, sharp focus on subject, professional lighting contrast.";
            
            let charDetails = "";
            if (charParams) {
                if (charParams.gender) charDetails += ` Gender: ${charParams.gender}.`;
                if (charParams.age) charDetails += ` Age: ${charParams.age}.`;
                if (charParams.hair) charDetails += ` Hair: ${charParams.hair}.`;
                if (charParams.ethnicity) charDetails += ` Ethnicity: ${charParams.ethnicity}.`;
                if (charParams.body) charDetails += ` Body: ${charParams.body}.`;
                if (charParams.eyes) charDetails += ` Eyes: ${charParams.eyes}.`;
                if (charParams.expression) charDetails += ` Expression: ${charParams.expression}.`;
                if (charParams.faceDetails) charDetails += ` Special Features: ${charParams.faceDetails}.`;
                if (charParams.outfit) charDetails += ` Wearing: ${charParams.outfit}.`;
            }

            subjectPrompt = `${modeEnforcement} ${charParams?.identity === 'exact' ? 'The Model (Identical Clone from Reference 1)' : 'A character inspired by Reference 1'} in ${background}.${charDetails} Focus on high-quality skin textures, expressive pose, and perfect lighting integration. The character should look natural and consistent.`;
            negPrompt = "Disconnected features, mismatching skin tones, distorted face, floating clothes, low quality, artifacting, generic AI face.";
            break;

        case 'ugc':
            modeEnforcement = "STYLE: Amateur TikTok/Reels UGC. Subject engaging directly with the camera.";
            cameraLogic = "Handheld iPhone front camera, slight natural shake, candid framing.";
            subjectPrompt = `${modeEnforcement} AUTHENTIC UGC SHOT in ${background} (${cameraLogic}). Natural expression. Model showcasing and interacting with ${productName} (${productDesc}). The product must be realistically positioned and scaled relative to the person. Background: ${background}.`;
            negPrompt = "Professional studio, over-polished, DSLR, cinematic lighting, beauty filter, floating product, disconnected hands, text, overlay, captions, subtitles, UI elements, graphics.";
            lipSyncLogic = "LIP-SYNC: Model is speaking, mouth moving precisely to dialogue: '[SCRIPT_SCENE_TERSEBUT]'.";
            break;

        case 'pov':
            const povVariations = [
                "Hands holding and rotating the product to show details",
                "Product sitting on a surface, hand reaching out to touch or use it",
                "Product being unboxed or opened by two hands",
                "Close-up of hands demonstrating a specific feature of the product",
                "Product being held up against the background to show scale",
                "Hands interacting with the product from a first-person perspective"
            ];
            const currentPov = povVariations[index % povVariations.length];
            modeEnforcement = "STYLE: First-person POV. Camera is the user's eyes. NO FACES VISIBLE.";
            cameraLogic = "iPhone 0.5x ultra-wide lens, looking down at the scene.";
            subjectPrompt = `${modeEnforcement} RAW POV SHOT in ${background}. ACTION: ${currentPov}. Hands naturally interacting with or using ${productName} (${productDesc}). The product must be correctly sized and positioned in the environment. Background: ${background}. Focus on realistic textures and product details. Natural ambient lighting.`;
            negPrompt = "Face, head, hair, eyes, mouth, person looking at camera, studio lighting, professional shot, 3D render, text, overlay, captions, subtitles, UI elements, graphics.";
            motionCamera = "Natural handheld shake, looking down at the interaction.";
            break;

        case 'selfie':
            const selfiePoses = [
                "standing straight, mirror reflection",
                "leaning side, checking product in mirror",
                "one hand in pocket, mirror selfie",
                "3/4 turn mirror reflection",
                "full-body mirror selfie"
            ];
            const currentPose = selfiePoses[index % selfiePoses.length];
            modeEnforcement = "STYLE: Mirror Selfie. Subject holding phone, pointing at a mirror.";
            cameraLogic = "Mirror reflection, shot on smartphone.";
            subjectPrompt = `${modeEnforcement} CANDID MIRROR SELFIE in ${background}. POSE: ${currentPose}. Model in front of mirror showcasing ${productName}. Background: ${background}. Maintain realistic product scale and positioning in the reflection. Natural room lighting, candid aesthetic.`;
            negPrompt = "No phone, no mirror, looking at camera lens, professional studio lighting, perfect symmetry, text, overlay, captions, subtitles, UI elements, graphics.";
            motionCamera = "Static mirror reflection, slight natural sway.";
            break;

        default:
            cameraLogic = "Casual smartphone photo.";
            subjectPrompt = `Authentic lifestyle snapshot of model with ${productName} in ${background}.`;
            negPrompt = "Distorted, blurry, CGI, 3D render, floating product.";
            motionCamera = "Slow cinematic pan.";
            break;
    }

    return { subjectPrompt, negPrompt, cameraLogic, motionCamera, lipSyncLogic, identityConstraint };
};
