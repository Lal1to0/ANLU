import csv
from supabase import create_client, Client

# Tus credenciales de Supabase
SUPABASE_URL = "https://lnuirjvcxurrhrmcuwvq.supabase.co"
SUPABASE_KEY = "sb_secret_O4q__UeHCgiZO32Uj4Hktg_noooyA6c"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def limpiar_numero(valor):
    if not valor:
        return 0.0
    # Limpia símbolos de moneda, espacios y cambia la coma decimal por punto
    valor_limpio = str(valor).replace("$", "").replace(" ", "").replace(",", ".")
    try:
        return float(valor_limpio)
    except ValueError:
        return 0.0

def migrar_csv_a_supabase(ruta_csv):
    print("## 🚀 INICIANDO MIGRACIÓN A SUPABASE ##")
    
    with open(ruta_csv, mode='r', encoding='utf-8') as archivo:
        lector = csv.DictReader(archivo)
        
        for fila in lector:
            nuevo_producto = {
                "nombre": fila.get("Nombre"),
                "marca": fila.get("Marca"),
                "genero": fila.get("Género"),
                "precio": limpiar_numero(fila.get("Precio")),
                "stock": int(limpiar_numero(fila.get("Stock"))),
                "imagen_url": fila.get("Imagen_URL"),
                "concentracion": fila.get("Concentración"),
                "acorde_1": fila.get("Acorde_1"),
                "acorde_2": fila.get("Acorde_2"),
                "acorde_3": fila.get("Acorde_3"),
                "acorde_4": fila.get("Acorde_4"),
                "acorde_5": fila.get("Acorde_5"),
                "notas_salida": fila.get("Notas_Salida"),
                "notas_corazon": fila.get("Notas_Corazón"),
                "notas_fondo": fila.get("Notas_Fondo"),
                "costo": limpiar_numero(fila.get("Costo"))
            }
            
            # Inserta el registro en la tabla 'productos'
            supabase.table("productos").insert(nuevo_producto).execute()
            print(f"✅ Producto migrado: {nuevo_producto['nombre']}")

    print("\n🎉 ¡Migración completada con éxito!")

if __name__ == "__main__":
    migrar_csv_a_supabase("catalogo.csv")