import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnInit
} from '@angular/core';
import { OutletService } from './outlet.service';

@Directive({
  selector: '[cxOutlet]'
})
export class OutletDirective implements OnInit {
  @Input('cxOutlet') outlet: string;

  constructor(
    private vcr: ViewContainerRef,
    private templateRef: TemplateRef<any>,
    private outletService: OutletService
  ) {}

  ngOnInit() {
    const customTemplate = this.outletService.get(this.outlet);

    const ctx = (<any>this.vcr.injector).view.context;
    this.vcr.createEmbeddedView(customTemplate || this.templateRef, {
      $implicit: ctx
    });
  }
}
