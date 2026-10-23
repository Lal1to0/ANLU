export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
    
    const { password, nombre, proveedor, cantidad, costo } = req.body;
    
    if (password !== process.env.ADMIN_PASSWORD) return res.status(401).json({ error: 'Contraseña incorrecta.' });

    try {
        const sheetsUrl = process.env.GOOGLE_SHEETS_URL;
        const response = await fetch(sheetsUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                accion: "reponer",
                nombre_buscar: nombre,
                proveedor: proveedor,
                cantidad: cantidad,
                costo_unitario: costo
            })
        });
        
        const result = await response.json();
        if(result.estado === "exito") {
            res.status(200).json({ resultado: "✅ ¡Mercancía ingresada! El stock se actualizó automáticamente." });
        } else {
            res.status(500).json({ error: result.mensaje });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
