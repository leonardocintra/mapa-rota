import { Injectable } from '@nestjs/common';
import { CreateRouteDto } from './dto/create-route.dto';
import { PrismaService } from '../prisma/prisma/prisma.service';
import { DirectionsService } from '../maps/directions/directions.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class RoutesService {
  constructor(
    private prismaService: PrismaService,
    private directionService: DirectionsService,
    @InjectQueue('kafka-producer')
    private kafkaProducerQueue: Queue,
  ) {}

  async create(createRouteDto: CreateRouteDto) {
    try {
      const { available_travel_modes, geocoded_waypoints, routes, request } =
        await this.directionService.getDirections(
          createRouteDto.source_id,
          createRouteDto.destination_id,
        );

      const legs = routes[0].legs[0];

      const routeCreated = await this.prismaService.route.create({
        data: {
          name: createRouteDto.name,
          source: {
            name: legs.start_address,
            location: {
              lat: legs.start_location.lat,
              lng: legs.start_location.lng,
            },
          },
          destination: {
            name: legs.end_address,
            location: {
              lat: legs.end_location.lat,
              lng: legs.end_location.lng,
            },
          },
          distance: legs.distance.value,
          duration: legs.duration.value,
          directions: JSON.stringify({
            available_travel_modes,
            geocoded_waypoints,
            routes,
            request,
          }),
        },
      });

      await this.kafkaProducerQueue.add({
        event: 'RouteCreated',
        id: routeCreated.id,
        name: routeCreated.name,
        distance: routeCreated.distance,
      });

      return routeCreated;
    } catch (err) {
      console.error(err);
    }
  }

  findAll() {
    return this.prismaService.route.findMany();
  }

  findOne(id: string) {
    return this.prismaService.route.findUniqueOrThrow({
      where: { id },
    });
  }
}
