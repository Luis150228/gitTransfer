requiero poder pasar por parametros el tamaño "180px" el color de fondo "bg-santander-500" el color de texto "bg-santander-500" que default sea "bg-santander-500", y el contenido por ejemplo pasar todo el h3, p y div por parametros tambien "
<h3 className="font-semibold mb-2 text-white">Resumen</h3>
<p className="text-sm text-mid-500">Equipos en Almacen</p>
<div className="mt-4 h-28 rounded-lg bg-light-50" />
"


function DoubleCard() {
    return (
        <div className="card lg:col-span-4 min-h-[180px] bg-santander-500 text-white">
            <h3 className="font-semibold mb-2 text-white">Resumen</h3>
            <p className="text-sm text-mid-500">Equipos en Almacen</p>
            <div className="mt-4 h-28 rounded-lg bg-light-50" />
        </div>
    )
}

export default DoubleCard