import { EntityStateAdapter, EntityState } from '../src/models';
import { createEntityAdapter } from '../src/create_adapter';
import {
  BookModel,
  TheGreatGatsby,
  AClockworkOrange,
  AnimalFarm,
} from './fixtures/book';

describe('Unsorted State Adapter', () => {
  let adapter: EntityStateAdapter<BookModel>;
  let state: EntityState<BookModel>;

  beforeAll(() => {
    Object.defineProperty(Array.prototype, 'unwantedField', {
      enumerable: true,
      configurable: true,
      value: 'This should not appear anywhere',
    });
  });

  afterAll(() => {
    Object.defineProperty(Array.prototype, 'unwantedField', {
      value: undefined,
    });
  });

  beforeEach(() => {
    adapter = createEntityAdapter({
      selectId: (book: BookModel) => book.idx,
    });

    state = { ids: [], entities: {} };
  });

  it('should let you add one entity to the state', () => {
    const withOneEntity = adapter.addOne(TheGreatGatsby, state);

    expect(withOneEntity).toEqual({
      ids: [TheGreatGatsby.idx],
      entities: {
        [TheGreatGatsby.idx]: TheGreatGatsby,
      },
    });
  });

  it('should not change state if you attempt to re-add an entity', () => {
    const withOneEntity = adapter.addOne(TheGreatGatsby, state);

    const readded = adapter.addOne(TheGreatGatsby, withOneEntity);

    expect(readded).toBe(withOneEntity);
  });

  it('should let you add many entities to the state', () => {
    const withOneEntity = adapter.addOne(TheGreatGatsby, state);

    const withManyMore = adapter.addMany(
      [AClockworkOrange, AnimalFarm],
      withOneEntity
    );

    expect(withManyMore).toEqual({
      ids: [TheGreatGatsby.idx, AClockworkOrange.idx, AnimalFarm.idx],
      entities: {
        [TheGreatGatsby.idx]: TheGreatGatsby,
        [AClockworkOrange.idx]: AClockworkOrange,
        [AnimalFarm.idx]: AnimalFarm,
      },
    });
  });

  it('should let you add all entities to the state', () => {
    const withOneEntity = adapter.addOne(TheGreatGatsby, state);

    const withAll = adapter.addAll(
      [AClockworkOrange, AnimalFarm],
      withOneEntity
    );

    expect(withAll).toEqual({
      ids: [AClockworkOrange.idx, AnimalFarm.idx],
      entities: {
        [AClockworkOrange.idx]: AClockworkOrange,
        [AnimalFarm.idx]: AnimalFarm,
      },
    });
  });

  it('should let you add remove an entity from the state', () => {
    const withOneEntity = adapter.addOne(TheGreatGatsby, state);

    const withoutOne = adapter.removeOne(TheGreatGatsby.idx, state);

    expect(withoutOne).toEqual({
      ids: [],
      entities: {},
    });
  });

  it('should let you remove many entities from the state', () => {
    const withAll = adapter.addAll(
      [TheGreatGatsby, AClockworkOrange, AnimalFarm],
      state
    );

    const withoutMany = adapter.removeMany(
      [TheGreatGatsby.idx, AClockworkOrange.idx],
      withAll
    );

    expect(withoutMany).toEqual({
      ids: [AnimalFarm.idx],
      entities: {
        [AnimalFarm.idx]: AnimalFarm,
      },
    });
  });

  it('should let you remove all entities from the state', () => {
    const withAll = adapter.addAll(
      [TheGreatGatsby, AClockworkOrange, AnimalFarm],
      state
    );

    const withoutAll = adapter.removeAll(withAll);

    expect(withoutAll).toEqual({
      ids: [],
      entities: {},
    });
  });

  it('should let you update an entity in the state', () => {
    const withOne = adapter.addOne(TheGreatGatsby, state);
    const changes = { title: 'A New Hope' };

    const withUpdates = adapter.updateOne(
      {
        id: TheGreatGatsby.idx,
        changes,
      },
      withOne
    );

    expect(withUpdates).toEqual({
      ids: [TheGreatGatsby.idx],
      entities: {
        [TheGreatGatsby.idx]: {
          ...TheGreatGatsby,
          ...changes,
        },
      },
    });
  });

  it('should not change state if you attempt to update an entity that has not been added', () => {
    const withUpdates = adapter.updateOne(
      {
        id: TheGreatGatsby.idx,
        changes: { title: 'A New Title' },
      },
      state
    );

    expect(withUpdates).toBe(state);
  });

  it('should not change ids state if you attempt to update an entity that has already been added', () => {
    const withOne = adapter.addOne(TheGreatGatsby, state);
    const changes = { title: 'A New Hope' };

    const withUpdates = adapter.updateOne(
      {
        id: TheGreatGatsby.idx,
        changes,
      },
      withOne
    );

    expect(withOne.ids).toBe(withUpdates.ids);
  });

  it('should let you update the id of entity', () => {
    const withOne = adapter.addOne(TheGreatGatsby, state);
    const changes = { idx: 'A New Id' };

    const withUpdates = adapter.updateOne(
      {
        id: TheGreatGatsby.idx,
        changes,
      },
      withOne
    );

    expect(withUpdates).toEqual({
      ids: [changes.idx],
      entities: {
        [changes.idx]: {
          ...TheGreatGatsby,
          ...changes,
        },
      },
    });
  });

  it('should let you update many entities in the state', () => {
    const firstChange = { title: 'First Change' };
    const secondChange = { title: 'Second Change' };
    const withMany = adapter.addAll([TheGreatGatsby, AClockworkOrange], state);

    const withUpdates = adapter.updateMany(
      [
        { id: TheGreatGatsby.idx, changes: firstChange },
        { id: AClockworkOrange.idx, changes: secondChange },
      ],
      withMany
    );

    expect(withUpdates).toEqual({
      ids: [TheGreatGatsby.idx, AClockworkOrange.idx],
      entities: {
        [TheGreatGatsby.idx]: {
          ...TheGreatGatsby,
          ...firstChange,
        },
        [AClockworkOrange.idx]: {
          ...AClockworkOrange,
          ...secondChange,
        },
      },
    });
  });

  it('should let you add one entity to the state with upsert()', () => {
    const withOneEntity = adapter.upsertOne(
      {
        id: TheGreatGatsby.idx,
        changes: TheGreatGatsby,
      },
      state
    );

    expect(withOneEntity).toEqual({
      ids: [TheGreatGatsby.idx],
      entities: {
        [TheGreatGatsby.idx]: TheGreatGatsby,
      },
    });
  });

  it('should let you update an entity in the state with upsert()', () => {
    const withOne = adapter.addOne(TheGreatGatsby, state);
    const changes = { title: 'A New Hope' };

    const withUpdates = adapter.upsertOne(
      {
        id: TheGreatGatsby.idx,
        changes,
      },
      withOne
    );

    expect(withUpdates).toEqual({
      ids: [TheGreatGatsby.idx],
      entities: {
        [TheGreatGatsby.idx]: {
          ...TheGreatGatsby,
          ...changes,
        },
      },
    });
  });

  it('should let you upsert many entities in the state', () => {
    const firstChange = { title: 'Zack', idx: TheGreatGatsby.idx };
    const secondChange = { title: 'Aaron', idx: AClockworkOrange.idx };
    const withMany = adapter.addAll([TheGreatGatsby], state);

    const withUpserts = adapter.upsertMany(
      [
        { id: TheGreatGatsby.idx, changes: firstChange },
        { id: AClockworkOrange.idx, changes: secondChange },
      ],
      withMany
    );

    expect(withUpserts).toEqual({
      ids: [TheGreatGatsby.idx, AClockworkOrange.idx],
      entities: {
        [TheGreatGatsby.idx]: {
          ...TheGreatGatsby,
          ...firstChange,
        },
        [AClockworkOrange.idx]: {
          ...AClockworkOrange,
          ...secondChange,
        },
      },
    });
  });
});
