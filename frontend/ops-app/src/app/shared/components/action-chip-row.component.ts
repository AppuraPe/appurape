import { Component } from '@angular/core';

@Component({
  selector: 'app-action-chip-row',
  standalone: true,
  host: {
    class:
      'mt-3 flex w-full min-w-0 max-w-full box-border gap-2 overflow-x-auto overscroll-x-contain px-0.5 pb-2 [scrollbar-width:none] [&>*]:shrink-0 [&::-webkit-scrollbar]:hidden',
  },
  template: `<ng-content />`,
})
export class ActionChipRowComponent {}
