"use client";

import { useEffect, useRef } from "react";
import { useMap } from "../hooks/useMap";
import { Route } from "../utils/model";
import { socket } from "../utils/socket-io";
import { Button } from "@mui/material";
import Grid2 from "@mui/material/Unstable_Grid2";
import { RouteSelect } from "../components/RouteSelect";

export default function DriverPage() {
  const BASE_PATH: string = process.env.NEXT_PUBLIC_NEXT_API_URL as string;

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map = useMap(mapContainerRef);

  useEffect(() => {
    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, []);

  async function startRoute() {
    const routeId = (document.getElementById("route") as HTMLSelectElement)
      .value;
    const response = await fetch(`${BASE_PATH}/routes/${routeId}`);
    const route: Route = await response.json();

    map?.removeAllRoutes();
    await map?.addRouteWithIcons({
      routeId: routeId,
      startMarkerOptions: {
        position: route.directions.routes[0].legs[0].start_location,
      },
      endMarkerOptions: {
        position: route.directions.routes[0].legs[0].end_location,
      },
      carMarkerOptions: {
        position: route.directions.routes[0].legs[0].start_location,
      },
    });

    const { steps } = route.directions.routes[0].legs[0];

    for (const step of steps) {
      await sleep(2500);
      map?.moveCar(routeId, step.start_location);
      socket.emit("new-point", {
        route_id: routeId,
        lat: step.start_location.lat,
        lng: step.start_location.lng,
      });

      await sleep(2500);
      map?.moveCar(routeId, step.end_location);
      socket.emit("new-point", {
        route_id: routeId,
        lat: step.end_location.lat,
        lng: step.end_location.lng,
      });
    }
  }

  return (
    <Grid2 container sx={{ display: "flex", flex: 1 }}>
      <Grid2 xs={4} px={2}>
        <h1>Minha Viagem</h1>
        <Button>Ronaldo</Button>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <RouteSelect id="route" />
          <Button
            type="submit"
            onClick={startRoute}
            variant="contained"
            fullWidth
          >
            Iniciar a Viagem
          </Button>
        </div>
      </Grid2>
      <Grid2 id="google-map" xs={8} ref={mapContainerRef}></Grid2>
    </Grid2>
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
