import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Route, Router } from '@angular/router';
import { UserService } from '@shared/services/user/user.service';

@Component({
  selector: 'app-pricing',
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PricingComponent {
  constructor(private _userService : UserService , private _router : Router){

  }
  get isAdmin(){
   return this._userService.isAdmin;
  }
  get isUser(){
    return this._userService.isStudent;
  }


  goToPayment(){
    if(this.isUser){
     return
    }else
    {
      this._router.navigateByUrl('/external/login')
    }
  }
}

