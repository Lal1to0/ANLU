export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
    
    const { password, nombre, precio, imagen } = req.body;
    
    if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Contraseña incorrecta.' });

    try {
        const sheetsUrl = process.env.GOOGLE_SHEETS_URL;
        const response = await fetch(sheetsUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                accion: "actualizar",
                nombre_buscar: nombre,
                nuevo_precio: precio,
                nueva_imagen: imagen
            })
        });
        
        const result = await response.json();
        if(result.estado === "exito") {
            res.status(200).json({ resultado: "✅ Producto actualizado correctamente." });
        } else {
            res.status(500).json({ error: result.mensaje });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
