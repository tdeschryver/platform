const deepFreeze = require('deep-freeze');

export interface BookModel {
  idx: string;
  title: string;
}

export const AClockworkOrange: BookModel = deepFreeze({
  idx: 'aco',
  title: 'A Clockwork Orange',
});

export const AnimalFarm: BookModel = deepFreeze({
  idx: 'af',
  title: 'Animal Farm',
});

export const TheGreatGatsby: BookModel = deepFreeze({
  idx: 'tgg',
  title: 'The Great Gatsby',
});
