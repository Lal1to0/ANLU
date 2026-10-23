export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { password, perfume } = req.body;

    // 1. Validar contraseña
    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Contraseña incorrecta. Acceso denegado.' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        
        // Comprobar si Vercel está leyendo la llave
        if (!apiKey) {
            console.error("Vercel no encuentra la variable GEMINI_API_KEY");
            return res.status(500).json({ error: 'Falta la API KEY de Gemini en las variables de Vercel. ¡Haz un Redeploy!' });
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
        const prompt = `Eres una base de datos experta en perfumería. Dame los datos de "${perfume}". 
        Devuelve ÚNICAMENTE los 15 datos separados por una tabulación (para pegar directo en Google Sheets).
        Estructura exacta: Nombre [TAB] Marca [TAB] Género [TAB] $0,00 [TAB] 0 [TAB] [TAB] Concentración [TAB] Acorde_1 [TAB] Acorde_2 [TAB] Acorde_3 [TAB] Acorde_4 [TAB] Acorde_5 [TAB] Notas_Salida [TAB] Notas_Corazón [TAB] Notas_Fondo.
        No uses markdown, ni tablas, ni saludos. Solo la línea de texto limpia.`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        // Comprobar si la IA de Google dio un error (ej. llave inválida)
        if (!response.ok) {
            console.error("Error de Gemini:", data);
            return res.status(500).json({ error: 'Error de la IA: ' + (data.error?.message || 'Llave API inválida') });
        }

        const resultadoTexto = data.candidates[0].content.parts[0].text.trim();
        res.status(200).json({ resultado: resultadoTexto });

    } catch (error) {
        console.error("Fallo general:", error);
        res.status(500).json({ error: 'Error del sistema: ' + error.message });
    }
}
