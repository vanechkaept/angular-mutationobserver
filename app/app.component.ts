import { Component ,HostListener, AfterViewInit, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { AppService } from './app.service';
import { Subscription, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

class HeightAndWidth{
  height:number;    
  width:number;
}

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public elements: string[];
  public height:number = 0;
  public width:number = 0;

  constructor(private appService: AppService) {
    this.elements = ['an element', 'another element', 'who cares'];
  }

  addElement(): void {
    this.elements.push('adding another');
  }

  removeElement(index: number): void {
    this.elements.splice(index, 1);
  }

  private subscription: Subscription;
  @ViewChild('divToTrackHeightChanges') divToTrackHeightChanges:ElementRef;  

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.doDivHeightChange(this.getHeightAndWidthObject());    
  }

  getHeightAndWidthObject():HeightAndWidth{
    const newValues = new HeightAndWidth();
    newValues.height = this.divToTrackHeightChanges.nativeElement.offsetHeight;
    newValues.width = this.divToTrackHeightChanges.nativeElement.offsetWidth;
    return newValues;
  }
  setupHeightMutationObserver() {
    const observerable$ = new Observable<HeightAndWidth>(observer => {
      // Callback function to execute when mutations are observed
      // this can and will be called very often
      const callback = (mutationsList, observer2)=> {
        observer.next(this.getHeightAndWidthObject());
      };
      // Create an observer instance linked to the callback function
      const elementObserver = new MutationObserver(callback);

      // Options for the observer (which mutations to observe)
      const config = { attributes: true, childList: true, subtree: true };
      // Start observing the target node for configured mutations
      elementObserver.observe(this.divToTrackHeightChanges.nativeElement, config);      
    });

    this.subscription = observerable$
      .pipe(
        debounceTime(50),//wait until 50 milliseconds have lapsed since the observable was last sent
        distinctUntilChanged()//if the value hasn't changed, don't continue
      )
      .subscribe((newValues => {
        this.doDivHeightChange(newValues);
      }));
  }

  doDivHeightChange(newValues:HeightAndWidth){
   this.height = newValues.height;
   this.width = newValues.width;
  }

  ngAfterViewInit() {
    this.setupHeightMutationObserver();
    this.doDivHeightChange(this.getHeightAndWidthObject());
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
