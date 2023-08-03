//? Project Type
enum ProjectStatus {
  Active,
  Finished,
}

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {}
}

//? Project State Management
//* the below refactor is more for larger applications that could have multiple states and thus more redundant code
// type Listener = (items: Project[]) => void;
type Listener<T> = (items: T[]) => void;

class State<T> {
  // private listeners: Listener<T>[] = [];
  //* changing from private to protected to allow child classes access
  protected listeners: Listener<T>[] = [];

  addListener(listenerFunction: Listener<T>) {
    this.listeners.push(listenerFunction);
  }
}

class ProjectState extends State<Project> {
  //? moved into the base State class
  // private listeners: Listener[] = [];
  private projects: Project[] = [];
  private static instance: ProjectState;

  private constructor() {
    //* as always, call super to inherit the parent constructor
    super();
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
    // return (this.instance ||= new ProjectState());
  }
  //? moved into the base State class
  // addListener(listenerFunction: Listener) {
  //   this.listeners.push(listenerFunction);
  // }

  addProject(title: string, description: string, numOfPeople: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      numOfPeople,
      ProjectStatus.Active //* this makes projects default to Active on creation
    );
    // {
    //   id: Math.random().toString(), //* not truly random but whatevs, it's a demo
    //   title: title,
    //   description: description,
    //   people: numOfPeople,
    // };
    this.projects.push(newProject);
    for (const listenerFunction of this.listeners) {
      listenerFunction(this.projects.slice()); //* adding slice ensures that this is brand new copy of the array instead of mutating the original and possible messing up other references to it
    }
  }
}

const projectState = ProjectState.getInstance(); //* instantiating a global constant and make sure that we only have and interact with one copy of the object in the whole application

//? AutoBind decorator
//* the _ and _2 just tells TS that you're aware you're not going to use these values, but that they must be accepted so that you can get to the third argument
function AutoBind(_: any, _2: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const adjustedDescriptor: PropertyDescriptor = {
    configurable: true,
    enumerable: false,
    get() {
      const boundFunction = originalMethod.bind(this);
      return boundFunction;
    },
  };
  return adjustedDescriptor;
}

//? input validation
interface Validatable {
  value: string | number;
  //* adding the ? denotes this as optional, could also be done 'required: boolean | undefined'
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

function validate(validatableInput: Validatable) {
  let isValid = true;
  if (validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }
  if (validatableInput.minLength != null && typeof validatableInput.value === "string") {
    isValid = isValid && validatableInput.value.length >= validatableInput.minLength;
  }
  if (validatableInput.maxLength != null && typeof validatableInput.value === "string") {
    isValid = isValid && validatableInput.value.length <= validatableInput.maxLength;
  }
  if (validatableInput.min != null && typeof validatableInput.value === "number") {
    isValid = isValid && validatableInput.value >= validatableInput.min;
  }
  if (validatableInput.max != null && typeof validatableInput.value === "number") {
    isValid = isValid && validatableInput.value <= validatableInput.max;
  }

  return isValid;
}

//? Component Base Class
//* we make this an abstract class because we don't want anyone to be able to directly instantiate it
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement; //* everything between the <template> tags
  hostElement: T; //* we don't know what concrete type this and the below element will be,
  element: U; //* so we define some generic types in the class definition to handle it

  constructor(
    templateId: string,
    hostElementId: string,
    insertAtStart: boolean,
    newElementId?: string //* optional params should always be the last params
  ) {
    this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
    this.hostElement = document.getElementById(hostElementId)! as T; //* typecasting since we don't necessarily know what the element will be

    const importedNode = document.importNode(this.templateElement.content, true);
    this.element = importedNode.firstElementChild as U; //* typecasting since we don't necessarily know what the element will be
    if (newElementId) {
      this.element.id = newElementId;
    }

    this.attachToDom(insertAtStart);
  }

  private attachToDom(insertAtBeginning: boolean) {
    this.hostElement.insertAdjacentElement(
      insertAtBeginning ? "afterbegin" : "beforeend",
      this.element
    );
  }

  //* adding these shows anyone else who works on the codebase that while the attaching happens here, the concrete configuration and rendering happens where this class is inherited
  //* sidenote, private abstract classes are not a thing allowed by TS
  abstract configure(): void;
  abstract renderContent(): void;
}

//? ProjectItem Class
class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> {
  private project: Project;

  //* not a must-do, but convention is to add getters/setters before the constructor
  get persons() {
    if (this.project.people === 1) {
      return "1 person";
    } else {
      return `${this.project.people} people`;
    }
  }

  constructor(hostId: string, project: Project) {
    super("single-project", hostId, false, project.id);
    this.project = project;

    this.configure();
    this.renderContent();
  }

  configure() {}

  renderContent() {
    this.element.querySelector("h2")!.textContent = this.project.title;
    //* this was only printing a number, and if you did + ' persons assigned' it wouldn't make sense with only one person so we use the getter
    // this.element.querySelector("h3")!.textContent = this.project.people.toString();
    //* getters are accessed like a property and don't need to be invoked with (), they just run when used
    this.element.querySelector("h3")!.textContent = this.persons + " assigned.";
    this.element.querySelector("p")!.textContent = this.project.description;
  }
}

//? ProjectList Class
//* we add 'extends Component' to cut down on duplicate code and increase reusability
class ProjectList extends Component<HTMLDivElement, HTMLElement> {
  //?this stuff is now in the Component class
  // templateElement: HTMLTemplateElement; //* everything between the <template> tags
  // hostElement: HTMLDivElement; //* the <div> where we want to render the templateElement
  // sectionElement: HTMLElement; //* there is no HTMLSectionElement so we go generic here
  assignedProjects: Project[]; //* making this an array of our Project type adds great autocomplete and typo checks
  // assignedProjects: Any[];

  //* using the 'private' shortcut to add the project type
  constructor(private type: "active" | "finished") {
    //* now we call super at the beginning to call the constructor of the base class, Component
    super("project-list", "app", false, `${type}-projects`);
    //?this stuff is now in the Component class
    // this.templateElement = document.getElementById("project-list")! as HTMLTemplateElement;
    // this.hostElement = document.getElementById("app")! as HTMLDivElement;
    this.assignedProjects = [];

    //?this stuff is now in the Component class
    // const importedNode = document.importNode(this.templateElement.content, true);
    // this.sectionElement = importedNode.firstElementChild as HTMLElement;
    // this.sectionElement.id = `${this.type}-projects`; //* dynamically sets the id

    //? also happens in Component class now
    // this.attachToDom();
    this.configure();
    this.renderContent();
  }

  //* not a must do, but convention is to have all public methods right below the constructor and before any private methods
  configure() {
    projectState.addListener((projects: Project[]) => {
      //* to fix the entire project list being rendered in both active and finished, we use the filter method
      const relevantProjects = projects.filter((prj) => {
        if (this.type === "active") {
          return prj.status === ProjectStatus.Active;
        }
        return prj.status === ProjectStatus.Finished;
      });

      //* this updates state, creating a new projects array
      // this.assignedProjects = projects;
      //* adding specificity to only store the correctly sorted projects array
      this.assignedProjects = relevantProjects;
      this.renderProjects();
    });
  }

  //* we have to remove 'private' here so that the base class can access it
  // private renderContent() {
  renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector("ul")!.id = listId;
    this.element.querySelector("h2")!.textContent = this.type.toUpperCase() + " PROJECTS";
  }

  private renderProjects() {
    const listELement = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
    //* we set innerHTML to an empty screen to clear the existing list before rendering to avoid duplicate projects
    //* this could cause a hit to performance in a more robust app, but it's fine for this example
    listELement.innerHTML = "";
    for (const projItem of this.assignedProjects) {
      //? this is replaced by the ProjectItem class
      // const listItem = document.createElement("li");
      // listItem.textContent = projItem.title;
      // listELement.appendChild(listItem);
      //* instantiate a new ProjectItem class with the proper args
      // new ProjectItem(this.element.id, projItem); //* the element here is the section, so we have to specify the ul in the section
      new ProjectItem(this.element.querySelector("ul")!.id, projItem);
    }
  }

  //? also happens in Component class now
  // private attachToDom() {
  //   //* this accesses the app <div> and inserts the section before the closing tag, so after the input form
  //   this.hostElement.insertAdjacentElement("beforeend", this.sectionElement);
  // }
}

//? ProjectInput Class
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  //?this stuff is now in the Component class
  // templateElement: HTMLTemplateElement; //* everything between the <template> tags
  // hostElement: HTMLDivElement; //* the <div> where we want to render the templateElement
  // formElement: HTMLFormElement; //* this is the fist child of the <template>
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement; //* the three inputs
  peopleInputElement: HTMLInputElement;

  constructor() {
    //* once again calling super to call the constructor of the base class
    super("project-input", "app", true, "user-input");
    //* using <> typecasting tells TS that what comes after is of that specific type
    //? this.templateElement = <HTMLTemplateElement>document.getElementById('project-input')!;
    //* the other method is to add 'as WhateverTheElementTypeIs' at the end
    //* the bang tells TS emphatically that the element will not be null
    //?this stuff is now in the Component class
    // this.templateElement = document.getElementById("project-input")! as HTMLTemplateElement;
    // this.hostElement = document.getElementById("app")! as HTMLDivElement;

    //* importNode() is global method available on document
    //* what this line is doing is importing everything between the <template> tags and storing it in importedNode. I'd probably call it something else, but this helps illustrate where it's coming from
    //* importNode takes a second argument, a boolean defining if it should do a deep clone, ie all levels of nesting
    //?this stuff is now in the Component class
    // const importedNode = document.importNode(this.templateElement.content, true);
    // this.formElement = importedNode.firstElementChild as HTMLFormElement; //* hover for deets
    // this.formElement.id = "user-input"; //* assigning an id to the form element here rather than in index.html, for whatever reason. Just shows you could also do it here I guess?

    //* gotta use querySelector on these folks even though they are being grabbed by id
    this.titleInputElement = this.element.querySelector("#title") as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector("#description") as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector("#people") as HTMLInputElement;

    this.configure(); //* here we call the private methods within the constructor
    // this.attachToDom();
  }

  //* this must also be changed to public to satisfy TS
  //* not a must do, but convention is to have all public methods right below the constructor and before any private methods
  configure() {
    //* depending on the project, just binding this can work fine and be less work, we're just demonstrating how you can add a method decorator to streamline things if it needed to happen in many places
    // this.formElement.addEventListener("submit", this.submitHandler.bind(this));
    this.element.addEventListener("submit", this.submitHandler);
  }

  //* this just needs to be added due to it being abstract in the base class and to make TS happy
  renderContent() {}

  //* the thought process behind these private methods is using the constructor for the rough gathering of all necessary pieces, and then private methods for fine tuning an output
  //* again, private methods can only be called from within the class they are defined in
  //? to define a tuple start with [] and then just list what types go in what spot
  private gatherUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInputElement.value;
    const enteredDescription = this.descriptionInputElement.value;
    const enteredPeople = this.peopleInputElement.value;

    //* here we create out validatable objects to be checked with the values we want
    const titleValidatable: Validatable = {
      value: enteredTitle,
      required: true,
    };
    const descriptionValidatable: Validatable = {
      value: enteredDescription,
      required: true,
      minLength: 5,
    };
    const peopleValidatable: Validatable = {
      value: +enteredPeople,
      required: true,
      min: 1,
      max: 5,
    };

    //* here we run the validation and return the tuple on if all evaluate true
    if (
      !validate(titleValidatable) ||
      !validate(descriptionValidatable) ||
      !validate(peopleValidatable)
    ) {
      alert("Invalid input, please try again!");
      return;
    } else {
      return [enteredTitle, enteredDescription, +enteredPeople];
    }

    //* below is some clumsy and not very reusable validation
    // if (
    //   enteredTitle.trim().length === 0 ||
    //   enteredDescription.trim().length === 0 ||
    //   enteredPeople.trim().length === 0
    // ) {
    //   alert("Invalid input, please try again!");
    //   return;
    // } else {
    //   return [enteredTitle, enteredDescription, +enteredPeople];
    // }
  }

  private clearInputs() {
    this.titleInputElement.value = "";
    this.descriptionInputElement.value = "";
    this.peopleInputElement.value = "";
  }

  @AutoBind
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
      const [title, description, people] = userInput;
      projectState.addProject(title, description, people);
      this.clearInputs();
    }
  }

  //? now handled in the base class
  // private attachToDom() {
  //   //* this accesses the app <div> and inserts the formElement after the opening tag
  //   this.hostElement.insertAdjacentElement("afterbegin", this.element);
  // }
}

const projInput = new ProjectInput();
const activeProjList = new ProjectList("active");
const finishedProjList = new ProjectList("finished");
