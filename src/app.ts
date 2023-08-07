//* this is special TS syntax for referencing files with the same namespace
//* this is just TS magic though and doesn't work like JS imports so there will be no compilation errors but there will be runtime errors
//* ^ this was solved by configuring the outFile in tsconfig
//* basically our TS is split up into nice and manageable files and the compiled JS is all in one big file
/// <reference path='models/drag-drop.ts' />
/// <reference path='models/project.ts' />
/// <reference path='state/project-state.ts' />
/// <reference path='util/validation.ts' />
/// <reference path='decorators/autobind.ts' />
/// <reference path='components/project-input.ts' />
/// <reference path='components/project-list.ts' />

namespace App {
  new ProjectInput();
  new ProjectList("active");
  new ProjectList("finished");
}
