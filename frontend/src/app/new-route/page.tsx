"use client";

import type { FindPlaceFromTextResponseData } from "@googlemaps/google-maps-services-js";
import { FormEvent } from "react";

export default function NewRoutePage() {
  const BASE_PATH: string = "http://localhost:3000";

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
    //https://youtu.be/-IgP1MiXo6E?t=2629

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

    const directionsData = await directionsResponse.json();

    console.log(directionsData);
  }

  return (
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
    </div>
  );
}
