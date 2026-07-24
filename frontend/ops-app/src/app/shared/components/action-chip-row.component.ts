import { Component } from '@angular/core';

@Component({
  selector: 'app-action-chip-row',
  standalone: true,
  host: {
    class:
      'mt-3 flex w-full max-w-full gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
  },
  template: `<ng-content />`,
})
export class ActionChipRowComponent {}
