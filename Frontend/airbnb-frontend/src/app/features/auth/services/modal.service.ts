import { 
  Injectable, 
  ComponentRef, 
  ViewContainerRef, 
  createComponent,
  EnvironmentInjector,
  ApplicationRef,
  Type,
  inject
} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private appRef = inject(ApplicationRef);
  private injector = inject(EnvironmentInjector);
  private modalRef: ComponentRef<any> | null = null;
  private overlayElement: HTMLElement | null = null;

  /**
   * Opens a modal with the given component
   * @param component The standalone component to open as modal
   * @param inputs Optional inputs to pass to the component
   * @returns ComponentRef of the opened modal
   */
  open<T>(component: Type<T>, inputs?: Partial<T>): ComponentRef<T> {
    // Close existing modal if any
    this.close();

    // Create overlay
    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'modal-overlay';
    this.overlayElement.addEventListener('click', (e) => {
      if (e.target === this.overlayElement) {
        this.close();
      }
    });

    // Create component
    const componentRef = createComponent(component, {
      environmentInjector: this.injector,
      elementInjector: this.injector
    });

    // Set inputs if provided
    if (inputs) {
      (Object.keys(inputs) as Array<keyof T>).forEach((key) => {
        (componentRef.instance as any)[key as any] = inputs[key] as any;
      });
    }

    // Attach component to application
    this.appRef.attachView(componentRef.hostView);

    // Append to overlay
    const domElem = (componentRef.hostView as any).rootNodes[0] as HTMLElement;
    this.overlayElement.appendChild(domElem);

    // Append overlay to body
    document.body.appendChild(this.overlayElement);
    document.body.style.overflow = 'hidden';

    // Add animation class
    setTimeout(() => {
      this.overlayElement?.classList.add('modal-overlay-open');
    }, 10);

    this.modalRef = componentRef;
    return componentRef;
  }

  /**
   * Closes the currently open modal
   */
  close(): void {
    if (!this.modalRef || !this.overlayElement) {
      return;
    }

    // Remove animation
    this.overlayElement.classList.remove('modal-overlay-open');
    this.overlayElement.classList.add('modal-overlay-closing');

    // Wait for animation to complete
    setTimeout(() => {
      // Detach component
      this.appRef.detachView(this.modalRef!.hostView);
      this.modalRef!.destroy();

      // Remove overlay
      if (this.overlayElement && this.overlayElement.parentNode) {
        this.overlayElement.parentNode.removeChild(this.overlayElement);
      }

      document.body.style.overflow = '';

      this.modalRef = null;
      this.overlayElement = null;
    }, 300); // Match CSS animation duration
  }

  /**
   * Check if a modal is currently open
   */
  isOpen(): boolean {
    return !!this.modalRef;
  }
}