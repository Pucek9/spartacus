import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { CartConfigService } from '@spartacus/cart/base/core';
import {
  ActiveCartFacade,
  Cart,
  OrderEntry,
  PromotionLocation,
  SelectiveCartFacade,
} from '@spartacus/cart/base/root';
import {
  AuthService,
  I18nTestingModule,
  RoutingService,
} from '@spartacus/core';
import { PromotionsModule } from '@spartacus/storefront';
import { Observable, of } from 'rxjs';
import { CartDetailsComponent } from './cart-details.component';

class MockActiveCartService {
  removeEntry(): void {}
  loadDetails(): void {}
  updateEntry(): void {}
  getActive(): Observable<Cart> {
    return of({ code: '123', totalItems: 1 } as Cart);
  }
  getEntries(): Observable<OrderEntry[]> {
    return of([{}]);
  }
  isStable(): Observable<boolean> {
    return of(true);
  }
}

interface CartItemComponentOptions {
  isSaveForLater?: boolean;
  optionalBtn?: any;
}

@Component({
  template: '',
  selector: 'cx-cart-item-list',
})
class MockCartItemListComponent {
  @Input()
  items: OrderEntry[];
  @Input()
  cartIsLoading: Observable<boolean>;
  @Input()
  options: CartItemComponentOptions = {
    isSaveForLater: false,
    optionalBtn: null,
  };
  @Input()
  promotionLocation: PromotionLocation = PromotionLocation.ActiveCart;
}

@Component({
  template: '',
  selector: 'cx-cart-coupon',
})
class MockCartCouponComponent {
  cartIsLoading = false;
}

@Component({
  selector: 'cx-cart-validation-warnings',
  template: '',
})
class MockCartValidationWarningsComponent {}

describe('CartDetailsComponent', () => {
  let component: CartDetailsComponent;
  let fixture: ComponentFixture<CartDetailsComponent>;
  let activeCartService: ActiveCartFacade;

  const mockSelectiveCartFacade = jasmine.createSpyObj('SelectiveCartFacade', [
    'getCart',
    'removeEntry',
    'getEntries',
    'isStable',
    'addEntry',
  ]);

  const mockCartConfig = jasmine.createSpyObj('CartConfigService', [
    'isSelectiveCartEnabled',
  ]);

  const mockAuthService = jasmine.createSpyObj('AuthService', [
    'isUserLoggedIn',
  ]);

  const mockRoutingService = jasmine.createSpyObj('RoutingService', ['go']);

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [RouterTestingModule, PromotionsModule, I18nTestingModule],
        declarations: [
          CartDetailsComponent,
          MockCartItemListComponent,
          MockCartCouponComponent,
          MockCartValidationWarningsComponent,
        ],
        providers: [
          { provide: SelectiveCartFacade, useValue: mockSelectiveCartFacade },
          { provide: AuthService, useValue: mockAuthService },
          { provide: RoutingService, useValue: mockRoutingService },
          {
            provide: ActiveCartFacade,
            useClass: MockActiveCartService,
          },
          {
            provide: CartConfigService,
            useValue: mockCartConfig,
          },
        ],
      }).compileComponents();

      mockCartConfig.isSelectiveCartEnabled.and.returnValue(true);
      mockSelectiveCartFacade.isStable.and.returnValue(of(true));
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CartDetailsComponent);
    component = fixture.componentInstance;
    activeCartService = TestBed.inject(ActiveCartFacade);
  });

  it('should create cart details component', () => {
    expect(component).toBeTruthy();
  });

  it('should move to save for later for login user', () => {
    const mockItem = {
      quantity: 5,
      product: {
        code: 'PR0000',
      },
    };
    mockAuthService.isUserLoggedIn.and.returnValue(of(true));
    mockSelectiveCartFacade.addEntry.and.callThrough();
    spyOn(activeCartService, 'removeEntry').and.callThrough();
    spyOn(activeCartService, 'getEntries').and.callThrough();
    spyOn(activeCartService, 'isStable').and.returnValue(of(true));
    fixture.detectChanges();
    component.saveForLater(mockItem);
    expect(activeCartService.removeEntry).toHaveBeenCalledWith(mockItem);
    expect(mockSelectiveCartFacade.addEntry).toHaveBeenCalledWith(
      mockItem.product.code,
      mockItem.quantity
    );
  });

  it('should go to login page for anonymous user', () => {
    const mockItem = {
      quantity: 5,
      product: {
        code: 'PR0000',
      },
    };
    mockAuthService.isUserLoggedIn.and.returnValue(of(false));
    component.saveForLater(mockItem);
    fixture.detectChanges();
    expect(mockRoutingService.go).toHaveBeenCalled();
  });

  it('should not show save for later when selective cart is disabled', () => {
    mockCartConfig.isSelectiveCartEnabled.and.returnValue(of(false));
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('button'));
    expect(el).toBe(null);
  });

  it('should show save for later when selective cart is enabled', () => {
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('button'));
    expect(el).toBeDefined();
  });

  it('should display cart text with cart number', () => {
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.css('.cx-total'));
    const cartName = el.nativeElement.innerText;
    expect(cartName).toEqual('cartDetails.cartName code:123');
  });
});
