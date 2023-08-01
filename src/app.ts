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
type Listener = (items: Project[]) => void;

class ProjectState {
  private listeners: Listener[] = [];
  private projects: Project[] = [];
  private static instance: ProjectState;

  private constructor() {}

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }
    this.instance = new ProjectState();
    return this.instance;
    // return (this.instance ||= new ProjectState());
  }

  addListener(listenerFunction: Listener) {
    this.listeners.push(listenerFunction);
  }

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

//? ProjectList Class
class ProjectList {
  templateElement: HTMLTemplateElement; //* everything between the <template> tags
  hostElement: HTMLDivElement; //* the <div> where we want to render the templateElement
  sectionElement: HTMLElement; //* there is no HTMLSectionElement so we go generic here
  assignedProjects: Project[]; //* making this an array of our Project type adds great autocomplete and typo checks
  // assignedProjects: Any[];

  //* using the 'private' shortcut to add the project type
  constructor(private type: "active" | "finished") {
    this.templateElement = document.getElementById("project-list")! as HTMLTemplateElement;
    this.hostElement = document.getElementById("app")! as HTMLDivElement;
    this.assignedProjects = [];

    const importedNode = document.importNode(this.templateElement.content, true);
    this.sectionElement = importedNode.firstElementChild as HTMLElement;
    this.sectionElement.id = `${this.type}-projects`; //* dynamically sets the id

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

    this.attachToDom();
    this.renderContent();
  }

  private renderProjects() {
    const listELement = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
    //* we set innerHTML to an empty screen to clear the existing list before rendering to avoid duplicate projects
    //* this could cause a hit to performance in a more robust app, but it's fine for this example
    listELement.innerHTML = "";
    for (const projItem of this.assignedProjects) {
      const listItem = document.createElement("li");
      listItem.textContent = projItem.title;
      listELement.appendChild(listItem);
    }
  }

  private renderContent() {
    const listId = `${this.type}-projects-list`;
    this.sectionElement.querySelector("ul")!.id = listId;
    this.sectionElement.querySelector("h2")!.textContent = this.type.toUpperCase() + " PROJECTS";
  }

  private attachToDom() {
    //* this accesses the app <div> and inserts the section before the closing tag, so after the input form
    this.hostElement.insertAdjacentElement("beforeend", this.sectionElement);
  }
}

//? ProjectInput Class
class ProjectInput {
  templateElement: HTMLTemplateElement; //* everything between the <template> tags
  hostElement: HTMLDivElement; //* the <div> where we want to render the templateElement
  formElement: HTMLFormElement; //* this is the fist child of the <template>
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement; //* the three inputs
  peopleInputElement: HTMLInputElement;

  constructor() {
    //* using <> typecasting tells TS that what comes after is of that specific type
    //? this.templateElement = <HTMLTemplateElement>document.getElementById('project-input')!;
    //* the other method is to add 'as WhateverTheElementTypeIs' at the end
    //* the bang tells TS emphatically that the element will not be null
    this.templateElement = document.getElementById("project-input")! as HTMLTemplateElement;
    this.hostElement = document.getElementById("app")! as HTMLDivElement;

    //* importNode() is global method available on document
    //* what this line is doing is importing everything between the <template> tags and storing it in importedNode. I'd probably call it something else, but this helps illustrate where it's coming from
    //* importNode takes a second argument, a boolean defining if it should do a deep clone, ie all levels of nesting
    const importedNode = document.importNode(this.templateElement.content, true);
    this.formElement = importedNode.firstElementChild as HTMLFormElement; //* hover for deets
    this.formElement.id = "user-input"; //* assigning an id to the form element here rather than in index.html, for whatever reason. Just shows you could also do it here I guess?

    //* gotta use querySelector on these folks even though they are being grabbed by id
    this.titleInputElement = this.formElement.querySelector("#title") as HTMLInputElement;
    this.descriptionInputElement = this.formElement.querySelector(
      "#description"
    ) as HTMLInputElement;
    this.peopleInputElement = this.formElement.querySelector("#people") as HTMLInputElement;

    this.configure(); //* here we call the private methods within the constructor
    this.attachToDom();
  }

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

  private configure() {
    //* depending on the project, just binding this can work fine and be less work, we're just demonstrating how you can add a method decorator to streamline things if it needed to happen in many places
    // this.formElement.addEventListener("submit", this.submitHandler.bind(this));
    this.formElement.addEventListener("submit", this.submitHandler);
  }

  private attachToDom() {
    //* this accesses the app <div> and inserts the formElement after the opening tag
    this.hostElement.insertAdjacentElement("afterbegin", this.formElement);
  }
}

const projInput = new ProjectInput();
const activeProjList = new ProjectList("active");
const finishedProjList = new ProjectList("finished");
