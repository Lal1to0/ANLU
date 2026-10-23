export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { password, perfume } = req.body;

    // 1. Validar la bóveda de seguridad
    if (password !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Contraseña incorrecta. Acceso denegado.' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        // 2. Instrucciones estrictas para la IA
        const prompt = `Eres una base de datos experta en perfumería. Dame los datos de "${perfume}". 
        Devuelve ÚNICAMENTE los 15 datos separados por una tabulación (para pegar directo en Google Sheets).
        Estructura exacta: Nombre [TAB] Marca [TAB] Género [TAB] $0,00 [TAB] 0 [TAB] [TAB] Concentración [TAB] Acorde_1 [TAB] Acorde_2 [TAB] Acorde_3 [TAB] Acorde_4 [TAB] Acorde_5 [TAB] Notas_Salida [TAB] Notas_Corazón [TAB] Notas_Fondo.
        No uses markdown, ni tablas, ni saludos. Solo la línea de texto limpia.`;

        // 3. Conexión con Gemini
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error('Fallo en la comunicación con la IA');
        }

        // 4. Enviar los datos listos al panel de ANLU
        const resultadoTexto = data.candidates[0].content.parts[0].text.trim();
        res.status(200).json({ resultado: resultadoTexto });

    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
}
