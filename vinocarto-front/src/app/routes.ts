import {Routes} from '@angular/router';
import {HomeComponent} from './home/home.component';
import {DetailsComponent} from './details/details.component';

const routeConfig: Routes = [
    {
        path: '',
        component: HomeComponent
    },
    {
        path: 'details/:id',
        component: DetailsComponent
    },
];
export default routeConfig;