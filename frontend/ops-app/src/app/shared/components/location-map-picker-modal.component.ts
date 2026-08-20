import {
  Component,
  ElementRef,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Check,
  Crosshair,
  Loader2,
  LucideAngularModule,
  MapPin,
  Navigation,
  X,
} from 'lucide-angular';
import type * as LeafletType from 'leaflet';

@Component({
  selector: 'app-location-map-picker-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (isOpen()) {
      <div class="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
        <!-- Backdrop dismiss click -->
        <div class="absolute inset-0" (click)="close()"></div>

        <!-- Modal Card -->
        <div
          class="relative z-10 flex flex-col w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] rounded-t-[28px] sm:rounded-[28px] bg-white shadow-2xl overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-6 duration-250"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
            <div class="flex items-center gap-2 min-w-0">
              <span class="grid h-8 w-8 place-items-center rounded-xl bg-orange-100 text-primary-700 shrink-0">
                <i-lucide [img]="mapPinIcon" class="h-4.5 w-4.5"></i-lucide>
              </span>
              <div class="min-w-0">
                <h3 class="text-sm font-black text-slate-900 truncate">{{ title() }}</h3>
                <p class="text-xs text-slate-500 truncate">Mueve el mapa hasta apuntar con el pin</p>
              </div>
            </div>

            <button
              type="button"
              (click)="close()"
              class="grid h-9 w-9 place-items-center rounded-full text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition active:scale-95"
              aria-label="Cerrar mapa"
            >
              <i-lucide [img]="closeIcon" class="h-5 w-5"></i-lucide>
            </button>
          </div>

          <!-- Map Box with Central Pin Overlay -->
          <div class="relative w-full h-[320px] sm:h-[360px] bg-slate-100 overflow-hidden">
            <div #mapContainer class="w-full h-full"></div>

            <!-- Central Target Pin -->
            <div class="pointer-events-none absolute inset-0 grid place-items-center z-[400]">
              <div class="flex flex-col items-center -translate-y-1/2 transition-transform duration-150" [class.-translate-y-8]="isMapMoving()">
                <!-- Pulse circle on ground -->
                <div class="h-3 w-3 rounded-full bg-primary-600/30 ring-4 ring-primary-600/20 animate-ping"></div>
                <!-- Pin icon -->
                <div class="grid h-10 w-10 place-items-center rounded-full bg-primary-700 text-white shadow-xl shadow-primary-700/50 border-2 border-white -mt-2">
                  <i-lucide [img]="mapPinIcon" class="h-5 w-5"></i-lucide>
                </div>
              </div>
            </div>

            <!-- GPS Floating Button -->
            <button
              type="button"
              (click)="centerOnCurrentGps()"
              [disabled]="isLocatingGps()"
              class="absolute right-3.5 bottom-3.5 z-[410] flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-slate-800 shadow-lg border border-slate-200/80 hover:bg-white active:scale-95 transition"
            >
              @if (isLocatingGps()) {
                <i-lucide [img]="loaderIcon" class="h-4 w-4 text-primary-700 animate-spin"></i-lucide>
                <span>Buscando GPS...</span>
              } @else {
                <i-lucide [img]="crosshairIcon" class="h-4 w-4 text-primary-700"></i-lucide>
                <span>Mi GPS</span>
              }
            </button>
          </div>

          <!-- Location Info & Confirm Actions Footer -->
          <div class="p-4 sm:p-5 grid gap-3.5 bg-white border-t border-slate-100">
            <!-- Selected point description -->
            <div class="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3 border border-slate-200/80">
              <i-lucide [img]="navigationIcon" class="h-4 w-4 text-primary-700 shrink-0 mt-0.5"></i-lucide>
              <div class="min-w-0 flex-1">
                @if (isGeocoding()) {
                  <span class="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <i-lucide [img]="loaderIcon" class="h-3 w-3 animate-spin"></i-lucide>
                    Obteniendo nombre del lugar...
                  </span>
                } @else {
                  <p class="text-xs font-bold text-slate-900 break-words leading-tight">
                    {{ currentAddressLabel() || 'Punto en el mapa' }}
                  </p>
                }
                <small class="block text-[11px] font-mono text-slate-400 mt-0.5">
                  Lat: {{ currentLat().toFixed(6) }} | Lng: {{ currentLng().toFixed(6) }}
                </small>
              </div>
            </div>

            <!-- Action Buttons based on Target mode -->
            <div class="grid gap-2" [class.grid-cols-2]="target() === 'both'">
              @if (target() === 'both' || target() === 'origin') {
                <button
                  type="button"
                  (click)="confirm('origin')"
                  class="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary-700 px-4 text-xs sm:text-sm font-black text-white shadow-md shadow-primary-700/25 hover:bg-primary-600 active:scale-95 transition"
                >
                  <i-lucide [img]="checkIcon" class="h-4 w-4"></i-lucide>
                  Fijar como Origen
                </button>
              }

              @if (target() === 'both' || target() === 'destination') {
                <button
                  type="button"
                  (click)="confirm('destination')"
                  class="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-xs sm:text-sm font-black text-white shadow-md shadow-slate-900/25 hover:bg-slate-800 active:scale-95 transition"
                >
                  <i-lucide [img]="checkIcon" class="h-4 w-4"></i-lucide>
                  Fijar como Destino
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class LocationMapPickerModalComponent {
  private static readonly DEFAULT_IQUITOS_LAT = -3.74912;
  private static readonly DEFAULT_IQUITOS_LNG = -73.25383;

  readonly isOpen = input(false);
  readonly target = input<'origin' | 'destination' | 'both'>('both');
  readonly initialLat = input<number | null>(null);
  readonly initialLng = input<number | null>(null);
  readonly title = input('Elegir ubicación en el mapa');

  readonly selected = output<{
    lat: number;
    lng: number;
    label: string;
    target: 'origin' | 'destination';
  }>();
  readonly closed = output<void>();

  readonly mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  readonly mapPinIcon = MapPin;
  readonly closeIcon = X;
  readonly crosshairIcon = Crosshair;
  readonly navigationIcon = Navigation;
  readonly checkIcon = Check;
  readonly loaderIcon = Loader2;

  readonly currentLat = signal(LocationMapPickerModalComponent.DEFAULT_IQUITOS_LAT);
  readonly currentLng = signal(LocationMapPickerModalComponent.DEFAULT_IQUITOS_LNG);
  readonly currentAddressLabel = signal('');
  readonly isMapMoving = signal(false);
  readonly isGeocoding = signal(false);
  readonly isLocatingGps = signal(false);

  private mapInstance: LeafletType.Map | null = null;
  private geocodeTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const lat = this.initialLat() ?? LocationMapPickerModalComponent.DEFAULT_IQUITOS_LAT;
        const lng = this.initialLng() ?? LocationMapPickerModalComponent.DEFAULT_IQUITOS_LNG;
        this.currentLat.set(lat);
        this.currentLng.set(lng);

        // Allow DOM to render then mount Leaflet map
        setTimeout(() => this.initializeMap(lat, lng), 60);
      } else {
        this.destroyMap();
      }
    });
  }

  private async initializeMap(lat: number, lng: number): Promise<void> {
    const container = this.mapContainer()?.nativeElement;
    if (!container) return;

    try {
      const L = await import('leaflet');

      this.destroyMap();

      this.mapInstance = L.map(container, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
      }).addTo(this.mapInstance);

      this.mapInstance.on('movestart', () => {
        this.isMapMoving.set(true);
      });

      this.mapInstance.on('moveend', () => {
        this.isMapMoving.set(false);
        if (!this.mapInstance) return;
        const center = this.mapInstance.getCenter();
        const nextLat = Number(center.lat.toFixed(6));
        const nextLng = Number(center.lng.toFixed(6));
        this.currentLat.set(nextLat);
        this.currentLng.set(nextLng);
        this.debounceReverseGeocode(nextLat, nextLng);
      });

      // Initial reverse geocode
      this.debounceReverseGeocode(lat, lng);
    } catch (err) {
      console.warn('Leaflet map initialization failed.', err);
    }
  }

  centerOnCurrentGps(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    this.isLocatingGps.set(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.isLocatingGps.set(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        this.currentLat.set(lat);
        this.currentLng.set(lng);

        if (this.mapInstance) {
          this.mapInstance.setView([lat, lng], 17, { animate: true });
        }
      },
      () => {
        this.isLocatingGps.set(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }

  private debounceReverseGeocode(lat: number, lng: number): void {
    if (this.geocodeTimeout) {
      clearTimeout(this.geocodeTimeout);
    }

    this.isGeocoding.set(true);
    this.geocodeTimeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
          { headers: { 'Accept-Language': 'es' } }
        );
        if (res.ok) {
          const data = await res.json();
          const road = data.address?.road || data.address?.pedestrian || data.address?.suburb;
          const neighbourhood = data.address?.neighbourhood || data.address?.city_district || data.address?.city;
          const label = road ? `${road}${neighbourhood ? ', ' + neighbourhood : ''}` : data.display_name?.split(',')[0];
          this.currentAddressLabel.set(label || `Ubicación (${lat}, ${lng})`);
        } else {
          this.currentAddressLabel.set(`Ubicación (${lat}, ${lng})`);
        }
      } catch {
        this.currentAddressLabel.set(`Ubicación (${lat}, ${lng})`);
      } finally {
        this.isGeocoding.set(false);
      }
    }, 400);
  }

  confirm(target: 'origin' | 'destination'): void {
    this.selected.emit({
      lat: this.currentLat(),
      lng: this.currentLng(),
      label: this.currentAddressLabel() || `Ubicación GPS (${this.currentLat()}, ${this.currentLng()})`,
      target,
    });
    this.close();
  }

  close(): void {
    this.destroyMap();
    this.closed.emit();
  }

  private destroyMap(): void {
    if (this.geocodeTimeout) {
      clearTimeout(this.geocodeTimeout);
      this.geocodeTimeout = null;
    }
    if (this.mapInstance) {
      try {
        this.mapInstance.remove();
      } catch {
        // Ignored on teardown
      }
      this.mapInstance = null;
    }
  }
}
