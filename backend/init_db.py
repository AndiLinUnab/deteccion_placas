import sqlite3

def init_runt_db():
    conn = sqlite3.connect("runt_mock.db")
    cursor = conn.cursor()

    # Crear tabla de vehículos
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vehiculos (
            placa TEXT PRIMARY KEY,
            propietario TEXT NOT NULL,
            marca_modelo TEXT NOT NULL,
            soat_estado TEXT NOT NULL,
            soat_vencimiento TEXT NOT NULL,
            tecnomecanica_estado TEXT NOT NULL,
            alerta_robo INTEGER NOT NULL,
            multas_pendientes INTEGER NOT NULL
        )
    """)

    # Insertar datos de prueba (incluye la placa con la que vas a hacer la demo)
    vehiculos_demo = [
        ("ABC123", "Carlos Rodríguez", "Chevrolet Onix 2022", "VIGENTE", "2027-05-15", "VIGENTE", 0, 0),
        ("XYZ987", "María Fernanda Gómez", "Mazda CX-5 2021", "VENCIDO", "2025-11-01", "VIGENTE", 0, 2),
        ("CFO682", "Juan Pablo Duarte", "Yamaha FZ25 2023", "VIGENTE", "2026-12-30", "VENCIDO", 1, 1),
        ("RCD549", "Ana María López", "Toyota Corolla 2020", "VIGENTE", "2027-03-20", "VIGENTE", 0, 0),
        ("VUS123", "Andrés Felipe Torres", "Honda Civic 2019", "VENCIDO", "2024-08-10", "VENCIDO", 0, 3),
        ("IAM650", "Sofía Martínez", "Kia Sportage 2022", "VIGENTE", "2027-01-05", "VIGENTE", 0, 0),
        ("OMG650", "Diego Alejandro Rojas", "Ford Ranger 2021", "VENCIDO", "2025-09-15", "VIGENTE", 1, 1),
        ("AAA123", "Valentina Pérez", "Chevrolet Tracker 2020", "VIGENTE", "2026-04-25", "VENCIDO", 0, 2),
        ("QFO640", "Sebastián Ramírez", "Renault Duster 2019", "VENCIDO", "2024-11-30", "VIGENTE", 0, 0),
        ("QGU210", "Camila Vargas", "Volkswagen Golf 2023", "VIGENTE", "2027-07-10", "VIGENTE", 0, 0)
    ]

    cursor.executemany("""
        INSERT OR REPLACE INTO vehiculos VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, vehiculos_demo)

    conn.commit()
    conn.close()
    print("Base de Datos RUNT Mock inicializada exitosamente.")

if __name__ == "__main__":
    init_runt_db()