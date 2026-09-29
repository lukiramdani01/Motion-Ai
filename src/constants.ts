/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Video, 
  Hand, 
  Shirt, 
  Smartphone,
  Package,
  Soup,
  UserCheck,
  PlayCircle
} from 'lucide-react';

export const GENERATIVE_MODEL = "gemini-2.5-flash-image";
export const TEXT_MODEL = "gemini-3-flash-preview"; 
export const TTS_MODEL = "gemini-3.1-flash-tts-preview";
export const VIDEO_MODEL = "veo-3.1-lite-generate-preview";

export const MODE_BACKGROUNDS = {
    vlog: [
        'Ruang Kerja Kreatif (Vibe Kantor Startup)',
        'Kamar Tidur Minimalis (Cahaya Pagi Lembut)',
        'Area Santai Kafe (Interior Kayu & Tanaman)',
        'Studio Apartemen Modern (City View Malam)',
        'Taman Belakang Rumah (Vibe Sore Hangat)',
        'Lobby Co-working Space (Modern & Profesional)',
        'Dapur Estetik (Kitchen Island Marmer)',
        'Sudut Baca Perpustakaan (Rak Buku Kayu)',
        'Balkon Unit High-Rise (Cityscape Jakarta)',
        'Koridor Mall Premium (Lampu Mewah)',
        'Teras Outdoor Kafe (Industrial Vibe)',
        'Ruang Podcast Profesional (Aksen Lampu Led)'
    ],
    ugc: [
        'Ruang Tamu Keluarga (TV & Sofa Nyaman)',
        'Dapur Rumah Subsidi (Meja Keramik Biru)',
        'Teras Depan Rumah KPR (Ada Tanaman Hias)',
        'Halaman Rumah Sore Hari (Suasana Komplek)',
        'Kamar Tidur Kos (Dinding Polos, Lampu Meja)',
        'Ruang Makan Sederhana (Meja Kayu & Taplak Catur)',
        'Belakang Rumah (Kebun Kecil/Area Cuci)',
        'Depan Minimarket Lokal (Parkiran Motor)',
        'Lorong Toko Kelontong (Vibe Kampung)',
        'Area Depan Pagar (Suasana Mendung Syahdu)',
        'Meja Belajar Anak Sekolah (Banyak Buku)',
        'Ruang TV Lesehan (Ada Karpet Pelangi)'
    ],
    pov: [
        'Dasbor Mobil Pribadi (Siang Hari Cerah)',
        'Meja Makan Plastik Warung (Ada Botol Kecap)',
        'Atas Meja Belajar (Lampu Meja Terang)',
        'Permukaan Karpet Bulu (Unboxing Vibe)',
        'Samping Tempat Tidur (Meja Kecil & Jam)',
        'Meja Setrikaan (Khas Ibu Rumah Tangga)',
        'Area Wastafel Dapur (Gaya Rumah Minimalis)',
        'Di Atas Sofa Ruang Tamu (Santai Sore)',
        'Meja Kantor (Laptop & Mug Kopi)',
        'Meja Kasir Warung (Ada Rak Snack)',
        'Atas Jok Motor Matic (View Setir)',
        'Meja Lipat Taman (Piknik Sederhana)'
    ],
    selfie: [
        'Kaca Toilet Mall (Pencahayaan Aesthetic)',
        'Kaca Fitting Room Toko retail Lokal',
        'Kaca Lift Perkantoran (Vibe Jakarta)',
        'Kaca Wastafel Restoran (Nuansa Bambu)',
        'Kaca Studio Foto (Background Polos)',
        'Kaca Rias Meja Tolet (Lampu Bohlam)',
        'Kaca Lemari Kamar (Kamar Tidur Kayu)',
        'Kaca Spion Motor (Selfie Helm)',
        'Kaca Lobby Hotel (Mewah & Megah)',
        'Kaca Cembung Parkiran (Estetik Unik)',
        'Refleksi Jendela Kafe (Sore Hari)',
        'Kaca Toilet SPBU (Besih & Terang)'
    ],
    food: [
        'Meja Kayu Rustik (Natural Sunlight)',
        'Latar Putih Bersih (Studio Minimalis)',
        'Dapur Marmer (Kitchen Set Mewah)',
        'Latar Belakang Gelap (Fine Dining)',
        'Meja Kafe Outdoor (Golden Hour)',
        'Piknik di Taman (Karpet Kotak-kotak)',
        'Meja Beton Industrial (Cafe Vibe)',
        'Restoran Vintage (Aksen Kayu Tua)',
        'Tatakan Batu Alam (Slate Stone)'
    ],
    model: [
        'Studio Foto Putih (Latar Polos Bersih)',
        'Studio Foto Abu-abu (Soft Lighting)',
        'Ruang Ganti Estetik (Minimalis Mirror)',
        'Lifestyle Jalanan (Urban City)',
        'Interior Butik (Aksen Emas)',
        'Taman Terbuka (Soft Sunlight)',
        'Kantor Modern (High-End Professional)'
    ]
};

export const VOICES = [
    { id: 'Puck', name: 'Budi (Pria)' },
    { id: 'Kore', name: 'Ayu (Wanita)' },
    { id: 'Charon', name: 'Rio (Pria)' },
    { id: 'Zephyr', name: 'Indra (Pria)' },
    { id: 'Fenrir', name: 'Dedi (Pria Berat)' }
];

export const TONES = [
    'Profesional', 'Antusias', 'Meyakinkan', 'Santai', 'Edukatif', 
    'Humor', 'Inspiratif', 'Serius', 'Sedih', 'Marah', 
    'Ketakutan', 'Mencekam', 'Tertawa'
];

export const VTO_ANGLES = [
    { name: "Front View", desc: "Full view from front. Model looking at camera. Clear view of the product." },
    { name: "Side View", desc: "Profile shot from the side. Highlighting product silhouette and design." },
    { name: "Back View", desc: "Shot from behind. Showing back details or alternative perspective." },
    { name: "3/4 View", desc: "Model turned 45 degrees. Dynamic interaction pose." },
    { name: "Close Up Detail", desc: "Close-up on specific product features or texture. Macro details." },
    { name: "Top Down", desc: "High angle shot looking down at the scene. Artistic perspective." },
    { name: "Full Scene Dynamic", desc: "Wide shot, model moving or interacting. Showing product in action." },
    { name: "Lifestyle Candid", desc: "Model laughing or interacting naturally. Lifestyle vibe." },
    { name: "Low Angle", desc: "Camera low looking up. Heroic product stance." },
    { name: "Seated Interaction", desc: "Model sitting while using or showcasing the product." },
    { name: "Feature Focus", desc: "Focus on specific product highlights or unique details." },
    { name: "Creative Angle", desc: "Dutch angle or artistic composition. Editorial style." }
];

export const MODES = [
    { id: 'vlog', title: 'VLOG PRO', icon: PlayCircle, desc: 'Visual vlog estetik & cinematic' },
    { id: 'ugc', title: 'UGC PRO', icon: Video, desc: 'Authentic testimonial style' },
    { id: 'pov', title: 'AFFILIATE REVIEW', icon: Hand, desc: 'First-person product interaction' },
    { id: 'selfie', title: 'MIRROR POV', icon: Smartphone, desc: 'Aesthetic mirror selfie' },
    { id: 'food', title: 'FOOD PHOTOGRAPHY', icon: Soup, desc: 'Estetik khusus foto makanan' },
    { id: 'model', title: 'CONSISTENT MODEL', icon: UserCheck, desc: 'Ganti model dengan wajah konsisten' },
];

export const RATIOS = [
    { label: 'Portrait', sub: '9:16', value: '9:16' },
    { label: 'Square', sub: '1:1', value: '1:1' },
    { label: 'Landscape', sub: '16:9', value: '16:9' }
];

export const SCENE_COUNTS = [1, 2, 4];

export const CHAR_HAIR_OPTIONS = [
    'Black Straight', 'Black Wavy', 'Black Curly', 'Dark Brown Short', 'Light Brown Long', 
    'Blonde Wavy', 'Platinum Blonde Straight', 'Red Auburn', 'Silver Grey', 'Bald',
    'Buzz Cut', 'Afro', 'Braids', 'Bob Cut', 'Pixie Cut'
];

export const CHAR_OUTFIT_OPTIONS = [
    'Casual T-Shirt & Jeans', 'Elegant Evening Dress', 'Boutique Silk Suit', 'Streetwear Oversized Hoodie', 'Professional Formal Shirt',
    'Traditional Ethnic Wear', 'Summer Beach Outfit', 'Winter Coat & Scarf', 'Sportswear / Gym Outfit', 'Luxury Designer Gown',
    'Vintage 90s Style', 'Cyberpunk Techwear', 'Bohemian Chic', 'Preppy Academic', 'Rugged Workwear'
];

export const CHAR_AGE_OPTIONS = [
    'Late Teens (18-19)', 'Early 20s', 'Mid 20s', 'Late 20s', 'Early 30s',
    'Mid 30s', 'Late 30s', 'Early 40s', 'Mid 40s', 'Mature (50+)',
    'Young Adult', 'Professional Age', 'Youthful Face', 'Sophisticated Adult', 'College Student'
];

export const CHAR_ETHNICITY_OPTIONS = [
    'Southeast Asian (Indonesian/Malay)', 'East Asian (Korean/Japanese)', 'South Asian (Indian/Pakistani)', 'Middle Eastern / Arab', 'Caucasian / European',
    'African / Black', 'Latino / Hispanic', 'Mixed / Multi-racial', 'Indigenous / Native', 'Mediterranean',
    'Pan-Asian', 'Northern European', 'Southern European', 'Polynesian / Pacific Islander', 'Central Asian'
];

export const CHAR_BODY_OPTIONS = [
    'Slim / Slender', 'Athletic / Toned', 'Muscular / Built', 'Curvy / Hourglass', 'Average / Regular',
    'Petite', 'Tall & Lanky', 'Stocky / Solid', 'Fit / Active', 'Soft / Rounded',
    'Fashion Model Proportions', 'Rugged / Strong', 'Elegant / Graceful', 'Compact', 'Robust'
];

export const CHAR_EYE_OPTIONS = [
    'Dark Brown', 'Black', 'Light Brown / Hazel', 'Blue', 'Deep Blue',
    'Green', 'Emerald Green', 'Grey', 'Amber', 'Heterochromia (Different)',
    'Sharp Piercing Eyes', 'Dreamy Soft Eyes', 'Almond Shape', 'Round Wide Eyes', 'Hooded Eyes'
];

export const CHAR_EXPRESSION_OPTIONS = [
    'Natural / Neutral', 'Happy / Smiling', 'Serious / Determined', 'Gentle / Warm Smile', 'Confident / Fierce',
    'Intense / Focused', 'Calm / Serene', 'Pensive / Thoughtful', 'Joyful / Laughing', 'Mysterious / Alluring',
    'Professional / Trustworthy', 'Surprised / Wide-eyed', 'Playful / Winking', 'Cool / Stoic', 'Empathetic / Kind'
];

export const CHAR_FACE_DETAIL_OPTIONS = [
    'Smooth Perfect Skin', 'Light Freckles', 'Dimples', 'Sharp Jawline', 'High Cheekbones',
    'Beauty Mark / Mole', 'Soft Facial Hair (Stubble)', 'Clean Shaven', 'Defined Contours', 'Natural Textures',
    'Youthful Glow', 'Mature Lines (Character)', 'Piercing(s)', 'Subtle Makeup', 'No Makeup (Raw)'
];
