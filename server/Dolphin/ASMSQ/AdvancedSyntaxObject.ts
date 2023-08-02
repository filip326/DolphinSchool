// Schueler in Klasse 5a
const pattern1 =
  /^(?<type>(L|l)ehrer|(S|s)chüler|(E|e)ltern) (im|in) (K|k)lasse (?<class>[0-9]+[a-z]?)$/;

// Schueler in Kurs [jahrgang] [fach] [optional LK + Nummer oder GK + Nummer] [lehrkraft]
const pattern2 =
  /^(?<type>(L|l)ehrer|(S|s)chüler|(E|e)ltern) (im|in) (K|k)urs (?<grade>[0-9]+|(E|Q)[1-4]) (?<subject>[a-zA-Z]+) ((?<courseType>(LK|GK)) (?<courseNumber>[0-9]+) )?(?<teacher>[a-zA-Z]+)$/;

// Schueler von [Lehrkraft]
// Eltern von [Lehrkraft]
// Lehrer von [Schueler]
const pattern3 = /^(?<type>(L|l)ehrer|(S|s)chüler|(E|e)ltern) (von|vom) (?<userOf>[a-zA-Z ]+)$/;

// Schueler im TUT-Kurs [jahrgang] [lehrkraft]
const pattern4 =
  /^(?<type>(L|l)ehrer|(S|s)chüler|(E|e)ltern) (im|in) (T|t)(ut|UT)-(K|k)urs (?<grade>(E|Q)[1-4]) (?<teacher>[a-zA-Z ]+)$/;

// Alle [?: Schueler|Eltern|Lehrer]
const pattern5 = /^Alle (?<type>(L|l)ehrer|(S|s)chüler|(E|e)ltern)?$/;

// Schueler im Jahrgang 5
const pattern6 =
  /^(?<type>(L|l)ehrer|(S|s)chüler|(E|e)ltern) (im|in) (J|j)ahrgang (?<grade>([0-9]+)|(Q|E)[1-4])$/;

interface ASMSQResult {
  type?: "teacher" | "student" | "parent" | "all";
  subtype?: "class" | "course" | "tut-course" | "userOf" | "grade";

  class?: string;
  grade?: string;

  course?: {
    grade?: string;
    subject?: string;
    courseType?: "LK" | "GK";
    courseNumber?: string;
    teacher?: string;
  };

  userOf?: string;
}

class ASMSQInterpreter {
  result: ASMSQResult[] = [];

  constructor(asmsq: string) {
    // split by ,
    const parts = asmsq.split(",");
    for (const part of parts) {
      let subresult: ASMSQResult = new Object();

      // trim
      const trimmed = part.trim();

      // match patterns 1-6
      const match1 = pattern1.exec(trimmed);
      const match2 = pattern2.exec(trimmed);
      const match3 = pattern3.exec(trimmed);
      const match4 = pattern4.exec(trimmed);
      const match5 = pattern5.exec(trimmed);
      const match6 = pattern6.exec(trimmed);

      if (match1) {
        switch (match1.groups?.type) {
          case "Lehrer":
          case "lehrer":
            subresult.type = "teacher";
            break;
          case "Schüler":
          case "schüler":
            subresult.type = "student";
            break;
          case "Eltern":
          case "eltern":
            subresult.type = "parent";
            break;
        }
        subresult.subtype = "class";
        subresult.class = match1.groups?.class;

        this.result.push(subresult);
        subresult = new Object();
      }

      if (match2) {
        switch (match2.groups?.type) {
          case "Lehrer":
          case "lehrer":
            subresult.type = "teacher";
            break;
          case "Schüler":
          case "schüler":
            subresult.type = "student";
            break;
          case "Eltern":
          case "eltern":
            subresult.type = "parent";
            break;
        }
        subresult.subtype = "course";

        subresult.course = new Object();
        subresult.course.grade = match2.groups?.grade;
        subresult.course.subject = match2.groups?.subject;
        subresult.course.teacher = match2.groups?.teacher;
        if (match2.groups?.courseType === "LK" || match2.groups?.courseType === "GK")
          subresult.course.courseType = match2.groups?.courseType;
        subresult.course.courseNumber = match2.groups?.courseNumber;
        subresult.course.teacher = match2.groups?.teacher;
        this.result.push(subresult);
        subresult = new Object();
      }

      if (match3) {
        switch (match3.groups?.type) {
          case "Lehrer":
          case "lehrer":
            subresult.type = "teacher";
            break;
          case "Schüler":
          case "schüler":
            subresult.type = "student";
            break;
          case "Eltern":
          case "eltern":
            subresult.type = "parent";
            break;
        }
        subresult.subtype = "userOf";
        subresult.userOf = match3.groups?.userOf;
        this.result.push(subresult);
        subresult = new Object();
      }

      if (match4) {
        switch (match4.groups?.type) {
          case "Lehrer":
          case "lehrer":
            subresult.type = "teacher";
            break;
          case "Schüler":
          case "schüler":
            subresult.type = "student";
            break;
          case "Eltern":
          case "eltern":
            subresult.type = "parent";
            break;
        }
        subresult.subtype = "tut-course";

        subresult.course = new Object();
        subresult.course.grade = match4.groups?.grade;
        subresult.course.teacher = match4.groups?.teacher;

        this.result.push(subresult);
        subresult = new Object();
      }

      if (match5) {
        switch (match5.groups?.type) {
          case "Lehrer":
          case "lehrer":
            subresult.type = "teacher";
            break;
          case "Schüler":
          case "schüler":
            subresult.type = "student";
            break;
          case "Eltern":
          case "eltern":
            subresult.type = "parent";
            break;
          default:
            subresult.type = "all";
        }
        this.result.push(subresult);
        subresult = new Object();
      }

      if (match6) {
        switch (match6.groups?.type) {
          case "Lehrer":
          case "lehrer":
            subresult.type = "teacher";
            break;
          case "Schüler":
          case "schüler":
            subresult.type = "student";
            break;
          case "Eltern":
          case "eltern":
            subresult.type = "parent";
            break;
        }
        subresult.subtype = "grade";
        subresult.grade = match6.groups?.grade;
        this.result.push(subresult);
        subresult = new Object();
      }
    }
  }
}

export default ASMSQInterpreter;
export type { ASMSQResult };
