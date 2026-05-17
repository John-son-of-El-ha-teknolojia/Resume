import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-text',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text.component.html',
  styleUrls: ['./text.component.css']
})
export class TextComponent {
  @Input() content: string = 'Editable Text';
  @Input() style: any = {
    fontSize: 14,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    color: '#000000',
    backgroundColor: '#ffffff'
  };

@Output() contentChange = new EventEmitter<string>();
@Output() styleChange = new EventEmitter<any>();


updateContent(event: any) {
  const newText = event.target.innerText;
  this.content = newText;
  this.contentChange.emit(newText); // emit string, not Event
}


  applyStyle(key: string, value: any) {
    this.style[key] = value;
    this.styleChange.emit(this.style);
  }
}
