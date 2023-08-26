"use client";

import type {
  DirectionsResponseData,
  FindPlaceFromTextResponseData,
} from "@googlemaps/google-maps-services-js";
import { FormEvent, useRef, useState } from "react";
import { useMap } from "../hooks/useMap";

export default function NewRoutePage() {
  const BASE_PATH: string = "http://localhost:3000";

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map = useMap(mapContainerRef);
  const [directionsData, setDirectionsData] = useState<
    DirectionsResponseData & { request: any }
  >();

  async function searchPlaces(event: FormEvent) {
    event.preventDefault();
    const source = (document.getElementById("source") as HTMLInputElement)
      .value;
    const destination = (
      document.getElementById("destination") as HTMLInputElement
    ).value;

    const [sourceResponse, destinationResponse] = await Promise.all([
      fetch(`${BASE_PATH}/places?text=${source}`),
      fetch(`${BASE_PATH}/places?text=${destination}`),
    ]);

    const [sourcePlace, destinationPlace]: FindPlaceFromTextResponseData[] =
      await Promise.all([sourceResponse.json(), destinationResponse.json()]);

    if (sourcePlace.status !== "OK") {
      console.error(sourcePlace);
      alert("Não foi possivel encontrar a origem");
      return;
    }

    if (destinationPlace.status !== "OK") {
      console.error(destinationPlace);
      alert("Não foi possivel encontrar a destino");
      return;
    }

    const placeSourceId = sourcePlace.candidates[0].place_id;
    const placeDestinationId = destinationPlace.candidates[0].place_id;

    const directionsResponse = await fetch(
      `${BASE_PATH}/directions?originId=${placeSourceId}&destinationId=${placeDestinationId}`
    );

    const directionsData: DirectionsResponseData & { request: any } =
      await directionsResponse.json();

    setDirectionsData(directionsData);

    map?.removeAllRoutes();

    await map?.addRouteWithIcons({
      routeId: "1",
      startMarkerOptions: {
        position: directionsData.routes[0].legs[0].start_location,
      },
      endMarkerOptions: {
        position: directionsData.routes[0].legs[0].end_location,
      },
      carMarkerOptions: {
        position: directionsData.routes[0].legs[0].start_location,
      },
    });
  }

  async function createRoute() {
    const startAddress = directionsData!.routes[0].legs[0].start_address;
    const endAddress = directionsData!.routes[0].legs[0].end_address;
    const response = await fetch(`${BASE_PATH}/routes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `${startAddress} - ${endAddress}`,
        source_id: directionsData!.request.origin.place_id,
        destination_id: directionsData!.request.destination.place_id,
      }),
    });

    const route = await response.json();
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        height: "100%",
        width: "100%",
      }}
    >
      <div>
        <h1>Nova rota</h1>
        <form
          method="post"
          style={{ display: "flex", flexDirection: "column" }}
          onSubmit={searchPlaces}
        >
          <div>
            <input id="source" type="text" placeholder="Origem ..." />
          </div>
          <div>
            <input id="destination" type="text" placeholder="Destino ..." />
          </div>
          <button type="submit">Pesquisar</button>
        </form>
        {directionsData && (
          <ul>
            <li>Origem: {directionsData.routes[0].legs[0].start_address}</li>
            <li>Destino: {directionsData.routes[0].legs[0].end_address}</li>
            <li>
              <button onClick={createRoute}>Criar rota</button>
            </li>
          </ul>
        )}
      </div>
      <div
        id="google-map"
        ref={mapContainerRef}
        style={{
          height: "100%",
          width: "100%",
        }}
      ></div>
    </div>
  );
}