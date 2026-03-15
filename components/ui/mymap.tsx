import { Map, MapControls } from "@/components/ui/map";
import { Card } from "@/components/ui/card";

export function MyMap() {
  return (
    // Quitamos los paddings por defecto del Card de Shadcn para que el mapa llene el espacio
    <Card className="w-full max-w-full overflow-hidden p-0 border-none shadow-none">
      <div className="relative h-full w-full">
        <Map 
          center={[-106.076,28.685 ]} 
          zoom={15}
          theme="light"
        >
          <MapControls />
        </Map>
      </div>
    </Card>
  );
}