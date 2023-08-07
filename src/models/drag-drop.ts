//* create a namespace with the namespace keyword, the name, and then the content in {}
//* initial issue is that this limits the availability of the code to the namespace, but adding the export keyword solves this and makes the content available in any like-named namespace
//? namespaces are cool but can be dangerous
//? removing/forgetting to add one can not throw a compilation error because another file has it imported so things still work
//? ES Modules are safer
// namespace App {
export interface Draggable {
  dragStartHandler(event: DragEvent): void;
}

export interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
}
// }
