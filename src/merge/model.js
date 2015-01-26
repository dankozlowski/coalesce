import Base from './base';
import ModelSet from '../collections/model_set';
import isEqual from '../utils/is_equal';
import fork from '../utils/fork';
import {dasherize} from '../utils/inflector';

/**
  Merge strategy that merges on a per-field basis.

  Fields which have been editted by both will
  default to "ours".

  Fields which do not have an ancestor will default to
  "theirs".

  @namespace merge
  @class ModelMerge
*/
export default class ModelMerge extends Base {

  merge(ours, ancestor, theirs, session, opts) {
    this.mergeAttributes(ours, ancestor, theirs, session);
    this.mergeRelationships(ours, ancestor, theirs, session);
    return ours;
  }

  mergeAttributes(ours, ancestor, theirs, session) {
    ours.eachAttribute(function(name, attribute) {
      this.mergeField(ours, ancestor, theirs, session, attribute);
    }, this);
  }

  mergeRelationships(ours, ancestor, theirs, session) {
    ours.eachRelationship(function(name, relationship) {
      this.mergeField(ours, ancestor, theirs, session, relationship);
    }, this);
  }

  mergeField(ours, ancestor, theirs, session, field) {
    var name = field.name,
        oursValue = ours[name],
        ancestorValue = ancestor[name],
        theirsValue = theirs[name];

    if(!ours.isFieldLoaded(name)) {
      if(theirs.isFieldLoaded(name)) {
        ours[name] = fork(theirsValue, session);
      }
      return;
    }
    
    if(!theirs.isFieldLoaded(name) || isEqual(oursValue, theirsValue)) {
      return;
    }
        
    // TODO: support custom attribute merging
    var merge = field.kind !== 'attribute' && this.mergeFor(dasherize(field.kind));
    if(merge) {
      ours[name] = merge.merge(oursValue, ancestorValue, theirsValue, session, field);
    } else {
      // default field merge logic
      if(!ancestor.isFieldLoaded(name) || isEqual(oursValue, ancestorValue)) {
        // if unchanged, always use theirs
        ours[name] = fork(theirsValue);
      } else {
        // ours was modified, use it instead of theirs
        // NO-OP
      }
    }
  }

}